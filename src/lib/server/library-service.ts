import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { idSchema, libraryPatchSchema, listSchema, tokenSchema } from "@/lib/validation";
import type { Snapshot, SharedList } from "@/lib/types";
import { serializeTitle } from "./serialize";
import { AppError } from "./errors";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** The actor comes from requireUser(), never a request body. Every private query includes it. */
export function libraryService(db: PrismaClient) {
  function actor(userId: string) {
    return idSchema.parse(userId);
  }
  async function ownedList(userId: string, listId: string, tx: Prisma.TransactionClient = db) {
    const list = await tx.customList.findFirst({
      where: { id: idSchema.parse(listId), userId: actor(userId) },
    });
    if (!list) throw new AppError(404, "List not found.");
    return list;
  }
  async function snapshot(userId: string): Promise<Snapshot> {
    actor(userId);
    const [user, entries, lists, share] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { name: true, preference: { select: { country: true } } },
      }),
      db.libraryEntry.findMany({
        where: { userId },
        include: { title: true },
        orderBy: { createdAt: "desc" },
      }),
      db.customList.findMany({
        where: { userId },
        include: {
          items: { include: { title: true }, orderBy: { createdAt: "desc" } },
          share: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.shareLink.findUnique({
        where: { userId_scope: { userId, scope: "watchlist" } },
        select: { id: true },
      }),
    ]);
    if (!user) throw new AppError(401, "Please sign in again.");
    return {
      user: { name: user.name || "Film lover", country: user.preference?.country || "US" },
      entries: entries.map((entry) => ({
        id: entry.id,
        titleId: entry.titleId,
        title: serializeTitle(entry.title),
        status: entry.status,
        rating: entry.rating,
        notes: entry.notes,
        season: entry.season,
        episode: entry.episode,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
      lists: lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        createdAt: list.createdAt.toISOString(),
        shared: !!list.share,
        items: list.items.map((item) => ({
          id: item.id,
          titleId: item.titleId,
          title: serializeTitle(item.title),
          createdAt: item.createdAt.toISOString(),
        })),
      })),
      watchlistShared: !!share,
    };
  }
  async function addLibrary(userId: string, titleId: string) {
    actor(userId);
    idSchema.parse(titleId);
    // MySQL INSERT IGNORE makes concurrent saves idempotent without overwriting progress.
    await db.libraryEntry.createMany({ data: [{ userId, titleId }], skipDuplicates: true });
    return db.libraryEntry.findUniqueOrThrow({ where: { userId_titleId: { userId, titleId } } });
  }
  async function patchEntry(userId: string, entryId: string, input: unknown) {
    const data = libraryPatchSchema.parse(input);
    const entry = await db.libraryEntry.findFirst({
      where: { id: idSchema.parse(entryId), userId: actor(userId) },
      include: { title: true },
    });
    if (!entry) throw new AppError(404, "Library entry not found.");
    if (data.season !== undefined || data.episode !== undefined) {
      if (entry.title.mediaType !== "tv")
        throw new AppError(400, "Episode progress is available for TV shows only.");
      const seasonNumber = data.season ?? entry.season;
      const episodeNumber = data.episode ?? entry.episode;
      const season = serializeTitle(entry.title).seasons.find(
        (item) => item.season_number === seasonNumber,
      );
      if (!season || episodeNumber > season.episode_count)
        throw new AppError(400, "Choose an available season and episode.");
    }
    const changed = await db.libraryEntry.updateMany({ where: { id: entryId, userId }, data });
    if (!changed.count) throw new AppError(404, "Library entry not found.");
  }
  async function removeEntry(userId: string, entryId: string) {
    const deleted = await db.libraryEntry.deleteMany({
      where: { id: idSchema.parse(entryId), userId: actor(userId) },
    });
    if (!deleted.count) throw new AppError(404, "Library entry not found.");
  }
  async function createList(userId: string, input: unknown) {
    return db.customList.create({ data: { userId: actor(userId), ...listSchema.parse(input) } });
  }
  async function updateList(userId: string, listId: string, input: unknown) {
    const updated = await db.customList.updateMany({
      where: { id: idSchema.parse(listId), userId: actor(userId) },
      data: listSchema.parse(input),
    });
    if (!updated.count) throw new AppError(404, "List not found.");
  }
  async function deleteList(userId: string, listId: string) {
    const deleted = await db.customList.deleteMany({
      where: { id: idSchema.parse(listId), userId: actor(userId) },
    });
    if (!deleted.count) throw new AppError(404, "List not found.");
  }
  async function addListItem(userId: string, listId: string, titleId: string) {
    return db.$transaction(async (tx) => {
      await ownedList(userId, listId, tx);
      return tx.listItem.createMany({
        data: [{ listId, titleId: idSchema.parse(titleId) }],
        skipDuplicates: true,
      });
    });
  }
  async function removeListItem(userId: string, listId: string, titleId: string) {
    await ownedList(userId, listId);
    await db.listItem.deleteMany({
      where: { listId, titleId: idSchema.parse(titleId), list: { userId } },
    });
  }
  async function share(userId: string, scope: string, action: "enable" | "regenerate" | "disable") {
    actor(userId);
    return db.$transaction(async (tx) => {
      if (scope !== "watchlist") await ownedList(userId, scope, tx);
      const where = { userId_scope: { userId, scope } };
      if (action === "disable") {
        await tx.shareLink.deleteMany({ where: { userId, scope } });
        return { enabled: false, token: null };
      }
      const existing = await tx.shareLink.findUnique({ where });
      if (existing && action === "enable")
        throw new AppError(409, "Sharing is already enabled. Regenerate to get a new link.");
      const token = randomBytes(32).toString("base64url");
      const tokenHash = hashToken(token);
      await tx.shareLink.upsert({
        where,
        create: { userId, scope, listId: scope === "watchlist" ? null : scope, tokenHash },
        update: { tokenHash },
      });
      return { enabled: true, token };
    });
  }
  async function readShared(token: string): Promise<SharedList> {
    if (!tokenSchema.safeParse(token).success)
      throw new AppError(404, "This shared list is unavailable.");
    return db.$transaction(async (tx) => {
      const link = await tx.shareLink.findUnique({
        where: { tokenHash: hashToken(token) },
        select: { userId: true, listId: true },
      });
      if (!link) throw new AppError(404, "This shared list is unavailable.");
      if (link.listId) {
        const list = await tx.customList.findFirst({
          where: { id: link.listId, userId: link.userId },
          select: {
            name: true,
            description: true,
            items: {
              select: { id: true, titleId: true, createdAt: true, title: true },
              orderBy: { createdAt: "desc" },
            },
          },
        });
        if (!list) throw new AppError(404, "This shared list is unavailable.");
        return {
          name: list.name,
          description: list.description,
          items: list.items.map((item) => ({
            id: item.id,
            titleId: item.titleId,
            title: serializeTitle(item.title),
            createdAt: item.createdAt.toISOString(),
          })),
        };
      }
      const items = await tx.libraryEntry.findMany({
        where: { userId: link.userId, status: "PLAN_TO_WATCH" },
        select: { id: true, titleId: true, createdAt: true, title: true },
        orderBy: { createdAt: "desc" },
      });
      return {
        name: "Watchlist",
        description: "A few stories worth making time for.",
        items: items.map((item) => ({
          id: item.id,
          titleId: item.titleId,
          title: serializeTitle(item.title),
          createdAt: item.createdAt.toISOString(),
        })),
      };
    });
  }
  return {
    snapshot,
    ownedList,
    addLibrary,
    patchEntry,
    removeEntry,
    createList,
    updateList,
    deleteList,
    addListItem,
    removeListItem,
    share,
    readShared,
  };
}
