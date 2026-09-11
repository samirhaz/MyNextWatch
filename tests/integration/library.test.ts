import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { createDatabaseClient } from "@/lib/server/database-client";
import { libraryService, hashToken } from "@/lib/server/library-service";
import { testDatabaseUrl } from "../../scripts/test-database-guard";
const db = createDatabaseClient(testDatabaseUrl());
const service = libraryService(db);
const run = randomUUID();
const users = [`test-a-${run}`, `test-b-${run}`];
const titleIds = [`test-movie-${run}`, `test-tv-${run}`];
let entryId: string;
let listId: string;
beforeAll(async () => {
  if (process.env.ALLOW_DISPOSABLE_DATABASE_TESTS !== "1") throw new Error("Use npm run test:db.");
  const version = await db.$queryRaw<{ version: string }[]>`SELECT VERSION() AS version`;
  expect(version[0].version).not.toMatch(/mariadb/i);
  await db.user.createMany({
    data: users.map((id, index) => ({ id, name: `Test ${index}`, email: `${id}@example.invalid` })),
  });
  const tmdbId = 1900000000 + Math.floor(Math.random() * 1000000);
  await db.title.createMany({
    data: titleIds.map((id, index) => ({
      id,
      tmdbId,
      mediaType: index === 0 ? "movie" : "tv",
      name: `Integration ${index}`,
      overview: "Synthetic test fixture",
      genres: [{ id: 18, name: "Drama" }],
      seasons: index === 1 ? [{ season_number: 1, name: "Season 1", episode_count: 10 }] : [],
      providers: {},
    })),
  });
});
afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.title.deleteMany({ where: { id: { in: titleIds } } });
  await db.$disconnect();
});
describe.sequential("real MySQL private library", () => {
  it("prevents duplicates under concurrent saves and preserves an existing rating", async () => {
    await Promise.all(Array.from({ length: 6 }, () => service.addLibrary(users[0], titleIds[0])));
    const entries = await db.libraryEntry.findMany({
      where: { userId: users[0], titleId: titleIds[0] },
    });
    expect(entries).toHaveLength(1);
    entryId = entries[0].id;
    await service.patchEntry(users[0], entryId, {
      rating: 8,
      notes: "Private note",
      status: "WATCHING",
    });
    await service.addLibrary(users[0], titleIds[0]);
    expect((await service.snapshot(users[0])).entries[0]).toMatchObject({
      rating: 8,
      status: "WATCHING",
    });
  });
  it("rejects User B reading or changing User A's private records", async () => {
    expect((await service.snapshot(users[1])).entries).toHaveLength(0);
    await expect(service.patchEntry(users[1], entryId, { rating: 1 })).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.removeEntry(users[1], entryId)).rejects.toMatchObject({ status: 404 });
    expect((await service.snapshot(users[0])).entries[0].rating).toBe(8);
  });
  it("enforces rating limits at the service and database layers", async () => {
    await expect(service.patchEntry(users[0], entryId, { rating: 11 })).rejects.toThrow();
    await expect(
      db.libraryEntry.update({ where: { id: entryId }, data: { rating: 0 } }),
    ).rejects.toThrow();
    await service.patchEntry(users[0], entryId, { rating: null });
    expect((await service.snapshot(users[0])).entries[0].rating).toBeNull();
  });
  it("creates a private list and adds/removes titles without library side effects", async () => {
    const list = await service.createList(users[0], {
      name: "Weekend",
      description: "Private by default",
    });
    listId = list.id;
    expect((await service.snapshot(users[0])).lists[0].shared).toBe(false);
    await Promise.all([
      service.addListItem(users[0], listId, titleIds[0]),
      service.addListItem(users[0], listId, titleIds[0]),
    ]);
    expect((await service.snapshot(users[0])).lists[0].items).toHaveLength(1);
    await expect(service.ownedList(users[1], listId)).rejects.toMatchObject({ status: 404 });
    await expect(service.addListItem(users[1], listId, titleIds[1])).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.updateList(users[1], listId, { name: "Stolen" })).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.deleteList(users[1], listId)).rejects.toMatchObject({ status: 404 });
    await expect(service.removeListItem(users[1], listId, titleIds[0])).rejects.toMatchObject({
      status: 404,
    });
    await service.removeListItem(users[0], listId, titleIds[0]);
    expect((await service.snapshot(users[0])).lists[0].items).toHaveLength(0);
    expect((await service.snapshot(users[0])).entries).toHaveLength(1);
    await service.addListItem(users[0], listId, titleIds[0]);
  });
  it("shares only explicit fields and revokes old tokens on regeneration", async () => {
    await expect(service.readShared(listId)).rejects.toMatchObject({ status: 404 });
    await expect(service.share(users[1], listId, "enable")).rejects.toMatchObject({ status: 404 });
    const first = await service.share(users[0], listId, "enable");
    expect(first.token).toHaveLength(43);
    const stored = await db.shareLink.findFirstOrThrow({ where: { listId } });
    expect(stored.tokenHash).toBe(hashToken(first.token!));
    const publicData = await service.readShared(first.token!);
    expect(publicData.items).toHaveLength(1);
    const json = JSON.stringify(publicData);
    for (const hidden of ["Private note", "userId", "email", "notes", "rating", "episode"])
      expect(json).not.toContain(`"${hidden}"`);
    const second = await service.share(users[0], listId, "regenerate");
    await expect(service.readShared(first.token!)).rejects.toMatchObject({ status: 404 });
    expect((await service.readShared(second.token!)).name).toBe("Weekend");
    await service.share(users[0], listId, "disable");
    await expect(service.readShared(second.token!)).rejects.toMatchObject({ status: 404 });
  });
  it("shares only Plan to Watch entries in the default watchlist", async () => {
    await service.addLibrary(users[0], titleIds[1]);
    const shared = await service.share(users[0], "watchlist", "enable");
    const result = await service.readShared(shared.token!);
    expect(result.items.map((item) => item.titleId)).toEqual([titleIds[1]]);
    await service.share(users[0], "watchlist", "disable");
    await expect(service.readShared(shared.token!)).rejects.toMatchObject({ status: 404 });
  });
  it("persists data across a fresh database connection and keeps movie/TV IDs separate", async () => {
    const anotherConnection = createDatabaseClient(testDatabaseUrl());
    try {
      const refreshed = await libraryService(anotherConnection).snapshot(users[0]);
      expect(refreshed.entries).toHaveLength(2);
      expect(refreshed.entries.find((entry) => entry.id === entryId)?.notes).toBe("Private note");
    } finally {
      await anotherConnection.$disconnect();
    }
  });
  it("bounds episode progress using actual stored season metadata", async () => {
    const entry = (await service.snapshot(users[0])).entries.find(
      (entry) => entry.title.mediaType === "tv",
    )!;
    await service.patchEntry(users[0], entry.id, { season: 1, episode: 10 });
    await expect(service.patchEntry(users[0], entry.id, { episode: 11 })).rejects.toMatchObject({
      status: 400,
    });
    await expect(service.patchEntry(users[0], entryId, { episode: 1 })).rejects.toMatchObject({
      status: 400,
    });
  });
  it("deletes custom lists without deleting ratings or the user's library", async () => {
    await service.patchEntry(users[0], entryId, { rating: 9 });
    const shared = await service.share(users[0], listId, "enable");
    await service.deleteList(users[0], listId);
    await expect(service.readShared(shared.token!)).rejects.toMatchObject({ status: 404 });
    expect(
      (await service.snapshot(users[0])).entries.find((entry) => entry.id === entryId)?.rating,
    ).toBe(9);
  });
  it("preserves long title names and persists country preferences", async () => {
    const name = "A deliberately long title, ".repeat(14);
    await db.title.update({ where: { id: titleIds[0] }, data: { name } });
    await db.userPreference.upsert({
      where: { userId: users[0] },
      create: { userId: users[0], country: "IL" },
      update: { country: "IL" },
    });
    const snapshot = await service.snapshot(users[0]);
    expect(snapshot.entries.find((entry) => entry.titleId === titleIds[0])?.title.name).toBe(name);
    expect(snapshot.user.country).toBe("IL");
  });
});
