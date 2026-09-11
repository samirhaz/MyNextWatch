import { privateRequest, readJson } from "@/lib/server/http";
import { COUNTRIES } from "@/lib/countries";
import { getDb } from "@/lib/server/db";
import { preferencesSchema } from "@/lib/validation";
import { AppError } from "@/lib/server/errors";
export const runtime = "nodejs";
export const PATCH = (request: Request) =>
  privateRequest(
    request,
    async (userId) => {
      const data = preferencesSchema.parse(await readJson(request));
      if (!COUNTRIES.some((country) => country.code === data.country))
        throw new AppError(400, "Choose a valid country.");
      await getDb().userPreference.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      return { saved: true };
    },
    "mutations",
    60,
  );
