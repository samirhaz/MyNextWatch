import { z } from "zod";
import { STATUSES } from "./types";
export const mediaTypeSchema = z.enum(["movie", "tv"]);
export const titleRefSchema = z
  .object({ mediaType: mediaTypeSchema, tmdbId: z.number().int().positive().max(2147483647) })
  .strict();
export const ratingSchema = z
  .number()
  .int()
  .min(1, "Choose a whole number from 1 to 10.")
  .max(10, "Choose a whole number from 1 to 10.")
  .nullable();
export const libraryPatchSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    rating: ratingSchema.optional(),
    notes: z.string().max(5000).nullable().optional(),
    season: z.number().int().min(0).max(1000).optional(),
    episode: z.number().int().min(0).max(10000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "No changes supplied.");
export const listSchema = z
  .object({
    name: z.string().trim().min(1, "Give your list a name.").max(100),
    description: z.string().trim().max(500).nullable().optional(),
  })
  .strict();
export const countrySchema = z.string().regex(/^[A-Z]{2}$/, "Choose a country.");
export const preferencesSchema = z.object({ country: countrySchema }).strict();
export const shareSchema = z
  .object({ action: z.enum(["enable", "regenerate", "disable"]) })
  .strict();
export const idSchema = z
  .string()
  .min(1)
  .max(191)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const tokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const catalogQuerySchema = z
  .object({
    q: z.string().trim().max(200).default(""),
    type: mediaTypeSchema.default("movie"),
    mode: z.enum(["trending", "discover"]).default("trending"),
    page: z.coerce.number().int().min(1).max(500).default(1),
    genre: z.string().regex(/^\d*$/).default(""),
    year: z
      .string()
      .regex(/^\d{0,4}$/)
      .default(""),
    provider: z.string().regex(/^\d*$/).default(""),
    sort: z
      .enum(["popularity.desc", "title.asc", "primary_release_date.desc", "vote_average.desc"])
      .default("popularity.desc"),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.q &&
      (value.genre || value.year || value.provider || value.sort !== "popularity.desc")
    ) {
      context.addIssue({
        code: "custom",
        message:
          "TMDB search does not support discovery filters. Clear the search to browse with filters.",
      });
    }
  });
export type LibraryPatch = z.infer<typeof libraryPatchSchema>;
