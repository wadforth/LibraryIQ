import { readSettings } from "../hooks/useLibraryIqSettings";
import type { LibraryIqSettings, SteamRatingResponse } from "../types";

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function describeReviewScore(score: number | null): string {
  switch (score) {
    case 1:
      return "Overwhelmingly Negative";
    case 2:
      return "Very Negative";
    case 3:
      return "Negative";
    case 4:
      return "Mostly Negative";
    case 5:
      return "Mixed";
    case 6:
      return "Mostly Positive";
    case 7:
      return "Positive";
    case 8:
      return "Very Positive";
    case 9:
      return "Overwhelmingly Positive";
    default:
      return "Steam rating";
  }
}

export function getNumericAppId(value: unknown): string | null {
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value))
  ) {
    return String(value);
  }

  return null;
}

export function getAppIdFromAppObject(app: unknown): string | null {
  if (!app || typeof app !== "object") {
    return null;
  }

  const obj = app as Record<string, unknown>;

  return (
    getNumericAppId(obj.appid) ??
    getNumericAppId(obj.appId) ??
    getNumericAppId(obj.unAppID) ??
    getNumericAppId(obj.nAppID) ??
    getNumericAppId(obj.m_unAppID) ??
    null
  );
}

export function getAppIdFromProps(props: unknown): string | null {
  if (!props || typeof props !== "object") {
    return null;
  }

  const obj = props as Record<string, unknown>;

  return getNumericAppId(obj.appid);
}

export function getAppIdFromSidebarIconProps(props: unknown): string | null {
  if (!props || typeof props !== "object") {
    return null;
  }

  const obj = props as Record<string, unknown>;

  if (!("app" in obj) || !("eAssetType" in obj)) {
    return null;
  }

  const appid = getAppIdFromAppObject(obj.app);

  if (!appid || appid === "0") {
    return null;
  }

  return appid;
}

export function getInternalRating(
  appid: string,
  settings: LibraryIqSettings = readSettings()
): SteamRatingResponse | null {
  const win = window as unknown as Record<string, unknown>;
  const appStore = win.appStore as Record<string, unknown> | undefined;
  const appMap = appStore?.m_mapApps;

  if (
    !appMap ||
    typeof appMap !== "object" ||
    typeof (appMap as Map<unknown, unknown>).get !== "function"
  ) {
    return null;
  }

  const app =
    (appMap as Map<unknown, unknown>).get(Number(appid)) ??
    (appMap as Map<unknown, unknown>).get(appid);

  if (!app || typeof app !== "object") {
    return null;
  }

  const obj = app as Record<string, unknown>;

  let percentage: number | null = null;
  let score: number | null = null;
  let source = "Steam app overview";

  if (settings.ratingSource === "filtered") {
    percentage =
      toNumber(obj.review_percentage_without_bombs) ??
      toNumber(obj.m_review_percentage_without_bombs) ??
      toNumber(obj.review_percentage_with_bombs) ??
      toNumber(obj.m_review_percentage_with_bombs) ??
      toNumber(obj.review_percentage);

    score =
      toNumber(obj.review_score_without_bombs) ??
      toNumber(obj.m_review_score_without_bombs) ??
      toNumber(obj.review_score_with_bombs) ??
      toNumber(obj.m_review_score_with_bombs);

    source = "Steam app overview · filtered";
  }

  if (settings.ratingSource === "unfiltered") {
    percentage =
      toNumber(obj.review_percentage_with_bombs) ??
      toNumber(obj.m_review_percentage_with_bombs) ??
      toNumber(obj.review_percentage_without_bombs) ??
      toNumber(obj.m_review_percentage_without_bombs) ??
      toNumber(obj.review_percentage);

    score =
      toNumber(obj.review_score_with_bombs) ??
      toNumber(obj.m_review_score_with_bombs) ??
      toNumber(obj.review_score_without_bombs) ??
      toNumber(obj.m_review_score_without_bombs);

    source = "Steam app overview · unfiltered";
  }

  if (settings.ratingSource === "api") {
    return null;
  }

  if (percentage === null) {
    return null;
  }

  return {
    ok: true,
    appid,
    positive_percent: Math.round(percentage),
    review_score: score ?? undefined,
    review_score_desc: describeReviewScore(score),
    source
  };
}
