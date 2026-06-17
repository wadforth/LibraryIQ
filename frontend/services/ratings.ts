import { callable } from "@steambrew/client";
import { getInternalRating } from "./steamAppStore";
import type { LibraryIqSettings, SteamRatingResponse } from "../types";

const getSteamRating = callable<[{ appid: string }], string>("get_steam_rating");

const ratingCache = new Map<string, SteamRatingResponse>();
const pendingRatings = new Map<string, Promise<SteamRatingResponse>>();

function getRatingCacheKey(appid: string, settings: LibraryIqSettings): string {
  return `${settings.ratingSource}:${appid}`;
}

function isDisplayableRating(rating: SteamRatingResponse | null): boolean {
  return Boolean(
    rating &&
      rating.ok &&
      typeof rating.positive_percent === "number" &&
      Number.isFinite(rating.positive_percent)
  );
}

function getApiFallbackRating(
  appid: string,
  settings: LibraryIqSettings
): SteamRatingResponse | null {
  const fallback = getInternalRating(appid, {
    ...settings,
    ratingSource: "filtered"
  });

  if (!fallback) {
    return null;
  }

  return {
    ...fallback,
    source: "Steam app overview · API fallback"
  };
}

export async function fetchRating(
  appid: string,
  settings: LibraryIqSettings
): Promise<SteamRatingResponse> {
  const cacheKey = getRatingCacheKey(appid, settings);
  const cached = ratingCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  if (settings.ratingSource !== "api") {
    const internal = getInternalRating(appid, settings);

    if (internal) {
      ratingCache.set(cacheKey, internal);
      return internal;
    }
  }

  const pending = pendingRatings.get(cacheKey);

  if (pending) {
    return pending;
  }

  const request = getSteamRating({ appid })
    .then((raw) => JSON.parse(raw) as SteamRatingResponse)
    .then((rating) => {
      const normalisedRating: SteamRatingResponse = {
        ...rating,
        source: "Steam reviews API · all languages",
        positive_percent:
          typeof rating.positive_percent === "number"
            ? Math.round(rating.positive_percent)
            : rating.positive_percent
      };

      if (isDisplayableRating(normalisedRating)) {
        ratingCache.set(cacheKey, normalisedRating);
        pendingRatings.delete(cacheKey);
        return normalisedRating;
      }

      const fallback = getApiFallbackRating(appid, settings);

      if (fallback) {
        ratingCache.set(cacheKey, fallback);
        pendingRatings.delete(cacheKey);
        return fallback;
      }

      ratingCache.set(cacheKey, normalisedRating);
      pendingRatings.delete(cacheKey);
      return normalisedRating;
    })
    .catch((error) => {
      const fallback = getApiFallbackRating(appid, settings);

      if (fallback) {
        ratingCache.set(cacheKey, fallback);
        pendingRatings.delete(cacheKey);
        return fallback;
      }

      const failed: SteamRatingResponse = {
        ok: false,
        appid,
        error: "frontend_fetch_failed",
        detail: String(error),
        source: "Unavailable"
      };

      ratingCache.set(cacheKey, failed);
      pendingRatings.delete(cacheKey);

      return failed;
    });

  pendingRatings.set(cacheKey, request);

  return request;
}