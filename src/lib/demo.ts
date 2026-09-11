import type { Snapshot, Title } from "./types";
// Curated sample metadata, never a live feed. Demo changes exist only in React memory.
const sample = (
  id: number,
  name: string,
  year: string,
  poster: string | null,
  extra: Partial<Title> = {},
): Title => ({
  id: `sample-${id}`,
  tmdbId: id,
  mediaType: "movie",
  name,
  releaseDate: `${year}-01-01`,
  posterPath: poster,
  backdropPath: null,
  overview:
    "A story to get lost in. Explore the sample tracker, save it for later, and make this collection your own.",
  communityRating: 8.1,
  genres: [{ id: 18, name: "Drama" }],
  runtime: 120,
  seasons: [],
  providers: {},
  providersUpdatedAt: null,
  ...extra,
});
export const DEMO_TITLES: Title[] = [
  sample(693134, "Dune: Part Two", "2024", "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", {
    genres: [
      { id: 878, name: "Science Fiction" },
      { id: 12, name: "Adventure" },
    ],
    runtime: 166,
    communityRating: 8.2,
    overview:
      "Paul Atreides joins Chani and the Fremen on a journey into the desert, caught between the people he loves and the fate of a universe. An epic made for a night with no distractions.",
  }),
  sample(157336, "Interstellar", "2014", "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", {
    backdropPath: "/pbrkL804c8yAv3zBZR4QPEafpAR.jpg",
    genres: [
      { id: 878, name: "Science Fiction" },
      { id: 18, name: "Drama" },
    ],
    runtime: 169,
    communityRating: 8.4,
  }),
  sample(680, "Pulp Fiction", "1994", "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", {
    genres: [{ id: 80, name: "Crime" }],
    runtime: 154,
    communityRating: 8.5,
  }),
  sample(27205, "Inception", "2010", "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", {
    genres: [
      { id: 878, name: "Science Fiction" },
      { id: 28, name: "Action" },
    ],
    runtime: 148,
    communityRating: 8.4,
  }),
  sample(
    120,
    "The Lord of the Rings: The Fellowship of the Ring",
    "2001",
    "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    {
      genres: [
        { id: 14, name: "Fantasy" },
        { id: 12, name: "Adventure" },
      ],
      runtime: 178,
      communityRating: 8.4,
    },
  ),
  sample(550, "Fight Club", "1999", "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", {
    runtime: 139,
    communityRating: 8.4,
  }),
  sample(1396, "Breaking Bad", "2008", "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg", {
    mediaType: "tv",
    genres: [
      { id: 18, name: "Drama" },
      { id: 80, name: "Crime" },
    ],
    runtime: null,
    seasons: [
      { season_number: 1, name: "Season 1", episode_count: 7 },
      { season_number: 2, name: "Season 2", episode_count: 13 },
      { season_number: 3, name: "Season 3", episode_count: 13 },
      { season_number: 4, name: "Season 4", episode_count: 13 },
      { season_number: 5, name: "Season 5", episode_count: 16 },
    ],
    communityRating: 8.9,
  }),
  sample(66732, "Stranger Things", "2016", "/uOOtwVbSr4QDjAGIifLDwpb2Pdl.jpg", {
    mediaType: "tv",
    genres: [{ id: 9648, name: "Mystery" }],
    runtime: null,
    seasons: [
      { season_number: 1, name: "Season 1", episode_count: 8 },
      { season_number: 2, name: "Season 2", episode_count: 9 },
    ],
    communityRating: 8.6,
  }),
  sample(496243, "Parasite", "2019", "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", {
    genres: [
      { id: 53, name: "Thriller" },
      { id: 18, name: "Drama" },
    ],
    runtime: 132,
    communityRating: 8.5,
  }),
  sample(129, "Spirited Away", "2001", "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", {
    genres: [
      { id: 16, name: "Animation" },
      { id: 14, name: "Fantasy" },
    ],
    runtime: 125,
    communityRating: 8.5,
  }),
  sample(346698, "Barbie", "2023", "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", {
    genres: [{ id: 35, name: "Comedy" }],
    runtime: 114,
    communityRating: 7.0,
  }),
  sample(99999999, "The Unwritten Chapter", "2026", null, {
    overview:
      "A fictional sample title to demonstrate the missing-poster state. This is not a TMDB listing.",
    communityRating: null,
  }),
];
export function demoSnapshot(): Snapshot {
  const entries = DEMO_TITLES.slice(0, 10).map((title, index) => ({
    id: `entry-${title.id}`,
    titleId: title.id,
    title,
    status: (index === 6 || index === 7
      ? "WATCHING"
      : index === 8 || index === 9
        ? "COMPLETED"
        : "PLAN_TO_WATCH") as Snapshot["entries"][number]["status"],
    rating: index === 8 ? 9 : index === 9 ? 10 : null,
    notes: null,
    season: index === 6 ? 2 : 1,
    episode: index === 6 ? 5 : index === 7 ? 3 : 0,
    createdAt: `2026-09-${String(10 - index).padStart(2, "0")}T18:00:00.000Z`,
    updatedAt: "2026-09-10T18:00:00.000Z",
  }));
  return {
    user: { name: "Alex", country: "US" },
    entries,
    watchlistShared: false,
    lists: [
      {
        id: "weekend",
        name: "A weekend well spent",
        description: "Put the phone away. Make some popcorn. Stay for the credits.",
        createdAt: "2026-09-01T18:00:00.000Z",
        shared: false,
        items: [0, 1, 3, 9].map((i) => ({
          id: `weekend-${i}`,
          titleId: DEMO_TITLES[i].id,
          title: DEMO_TITLES[i],
          createdAt: entries[i].createdAt,
        })),
      },
      {
        id: "rewatch",
        name: "Worth another watch",
        description: "The ones that stay with you.",
        createdAt: "2026-09-02T18:00:00.000Z",
        shared: false,
        items: [2, 8, 9].map((i) => ({
          id: `rewatch-${i}`,
          titleId: DEMO_TITLES[i].id,
          title: DEMO_TITLES[i],
          createdAt: entries[i].createdAt,
        })),
      },
    ],
  };
}
