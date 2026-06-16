import { Millennium, callable, definePlugin } from "@steambrew/client";
import { useEffect, useState } from "react";

type WebpackRequire = ((id: number | string) => unknown) & {
  m?: Record<string, unknown>;
  c?: Record<string, unknown>;
};

type JsxFn = (type: unknown, props: unknown, key?: unknown) => unknown;

type SteamRatingResponse = {
  ok: boolean;
  appid?: string;
  review_score?: number;
  review_score_desc?: string;
  total_positive?: number;
  total_negative?: number;
  total_reviews?: number;
  positive_percent?: number | null;
  updated_at?: number;
  source?: string;
  error?: string;
  detail?: string;
};

const getSteamRating = callable<[{ appid: string }], string>("get_steam_rating");

const STYLE_ID = "library-iq-sidebar-rating-style";

let installed = false;

const ratingCache = new Map<string, SteamRatingResponse>();
const pendingRatings = new Map<string, Promise<SteamRatingResponse>>();

function installStyles() {
  const existing = document.getElementById(STYLE_ID);

  if (existing) {
    existing.remove();
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .library-iq-sidebar-host {
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
      min-width: 0 !important;
    }

    .library-iq-icon-rating-wrap {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: flex-start !important;
      flex: 0 0 78px !important;
      width: 78px !important;
      min-width: 78px !important;
      max-width: 78px !important;
      gap: 6px !important;
      padding-right: 9px !important;
      box-sizing: border-box !important;
      overflow: visible !important;
      vertical-align: middle !important;
    }

    .library-iq-rating-badge {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 39px !important;
      width: 39px !important;
      min-width: 39px !important;
      max-width: 39px !important;
      height: 16px !important;
      padding: 0 5px !important;
      border-radius: 999px !important;
      box-sizing: border-box !important;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      line-height: 16px !important;
      letter-spacing: -0.25px !important;
      white-space: nowrap !important;
      user-select: none !important;
      pointer-events: auto !important;
      text-align: center !important;
      transform: translateY(0.5px);
    }
  `;

  document.head.appendChild(style);
}
function getWebpackRequire(): WebpackRequire | null {
  const win = window as unknown as {
    webpackChunksteamui?: unknown[];
  };

  try {
    let capturedRequire: WebpackRequire | null = null;

    win.webpackChunksteamui = win.webpackChunksteamui || [];

    win.webpackChunksteamui.push([
      [`library-iq-sidebar-rating-${Date.now()}`],
      {},
      (req: WebpackRequire) => {
        capturedRequire = req;
      }
    ]);

    return capturedRequire;
  } catch (error) {
    console.error("[LibraryIQ] Failed to capture webpack require", error);
    return null;
  }
}

function toNumber(value: unknown): number | null {
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

function getNumericAppId(value: unknown): string | null {
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value))
  ) {
    return String(value);
  }

  return null;
}

function getAppIdFromAppObject(app: unknown): string | null {
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

function getAppIdFromProps(props: unknown): string | null {
  if (!props || typeof props !== "object") {
    return null;
  }

  const obj = props as Record<string, unknown>;

  return getNumericAppId(obj.appid);
}

function getAppIdFromSidebarIconProps(props: unknown): string | null {
  if (!props || typeof props !== "object") {
    return null;
  }

  const obj = props as Record<string, unknown>;

  if (!("app" in obj)) {
    return null;
  }

  if (!("eAssetType" in obj)) {
    return null;
  }

  const appid = getAppIdFromAppObject(obj.app);

  if (!appid || appid === "0") {
    return null;
  }

  return appid;
}

function isSidebarVisibleWrapperProps(props: unknown): boolean {
  if (!props || typeof props !== "object") {
    return false;
  }

  const obj = props as Record<string, unknown>;
  const appid = getAppIdFromProps(props);

  if (!appid || appid === "0") {
    return false;
  }

  return (
    "className" in obj &&
    "appid" in obj &&
    "strCollectionId" in obj &&
    "includeMultiSelect" in obj &&
    "children" in obj
  );
}

function getInternalRating(appid: string): SteamRatingResponse | null {
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

  const percentage =
    toNumber(obj.review_percentage_without_bombs) ??
    toNumber(obj.m_review_percentage_without_bombs) ??
    toNumber(obj.review_percentage_with_bombs) ??
    toNumber(obj.m_review_percentage_with_bombs) ??
    toNumber(obj.review_percentage);

  const score =
    toNumber(obj.review_score_without_bombs) ??
    toNumber(obj.m_review_score_without_bombs) ??
    toNumber(obj.review_score_with_bombs) ??
    toNumber(obj.m_review_score_with_bombs);

  if (percentage === null) {
    return null;
  }

  return {
    ok: true,
    appid,
    positive_percent: Math.round(percentage),
    review_score: score ?? undefined,
    review_score_desc: describeReviewScore(score),
    source: "Steam app overview"
  };
}

async function fetchRating(appid: string): Promise<SteamRatingResponse> {
  const cached = ratingCache.get(appid);

  if (cached) {
    return cached;
  }

  const internal = getInternalRating(appid);

  if (internal) {
    ratingCache.set(appid, internal);
    return internal;
  }

  const pending = pendingRatings.get(appid);

  if (pending) {
    return pending;
  }

  const request = getSteamRating({ appid })
    .then((raw) => JSON.parse(raw) as SteamRatingResponse)
    .then((rating) => {
      const normalisedRating: SteamRatingResponse = {
        ...rating,
        source: "Steam reviews API",
        positive_percent:
          typeof rating.positive_percent === "number"
            ? Math.round(rating.positive_percent)
            : rating.positive_percent
      };

      ratingCache.set(appid, normalisedRating);
      pendingRatings.delete(appid);

      return normalisedRating;
    })
    .catch((error) => {
      const failed: SteamRatingResponse = {
        ok: false,
        appid,
        error: "frontend_fetch_failed",
        detail: String(error),
        source: "Unavailable"
      };

      ratingCache.set(appid, failed);
      pendingRatings.delete(appid);

      return failed;
    });

  pendingRatings.set(appid, request);

  return request;
}

function hasDisplayableRating(rating: SteamRatingResponse | null): boolean {
  return Boolean(
    rating &&
      rating.ok &&
      typeof rating.positive_percent === "number" &&
      Number.isFinite(rating.positive_percent)
  );
}

function getBadgeColours(rating: SteamRatingResponse) {
  const score = rating.positive_percent ?? 0;

  if (score >= 85) {
    return {
      background: "rgba(54, 118, 76, 0.42)",
      border: "rgba(112, 190, 132, 0.42)",
      color: "rgba(222, 255, 229, 0.96)"
    };
  }

  if (score >= 70) {
    return {
      background: "rgba(47, 96, 78, 0.38)",
      border: "rgba(96, 166, 135, 0.36)",
      color: "rgba(220, 248, 236, 0.94)"
    };
  }

  if (score >= 50) {
    return {
      background: "rgba(125, 91, 36, 0.42)",
      border: "rgba(207, 160, 82, 0.38)",
      color: "rgba(255, 235, 203, 0.94)"
    };
  }

  return {
    background: "rgba(120, 48, 48, 0.42)",
    border: "rgba(204, 100, 100, 0.38)",
    color: "rgba(255, 221, 221, 0.94)"
  };
}

function SteamSidebarRatingBadge({ appid }: { appid: string }) {
  const [rating, setRating] = useState<SteamRatingResponse | null>(() =>
    getInternalRating(appid)
  );

  useEffect(() => {
    let cancelled = false;

    fetchRating(appid).then((nextRating) => {
      if (!cancelled) {
        setRating(nextRating);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [appid]);

  if (!hasDisplayableRating(rating)) {
    return (
      <span
        className="library-iq-rating-badge"
        style={{
          display: "inline-flex",
          width: "40px",
          minWidth: "40px",
          height: "16px",
          opacity: 0,
          pointerEvents: "none"
        }}
      />
    );
  }

  const displayRating = rating as SteamRatingResponse;
  const colours = getBadgeColours(displayRating);

  return (
    <span
      className="library-iq-rating-badge"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        width: "40px",
        minWidth: "40px",
        maxWidth: "40px",
        height: "16px",
        padding: "0 5px",
        borderRadius: "999px",
        boxSizing: "border-box",

        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        fontWeight: 800,
        lineHeight: "16px",
        letterSpacing: "0px",
        whiteSpace: "nowrap",
        textAlign: "center",
        userSelect: "none",
        pointerEvents: "auto",

        color: colours.color,
        border: `1px solid ${colours.border}`,
        background: colours.background,

        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 1px rgba(0,0,0,0.18)",

        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale"
      }}
      title={`${displayRating.review_score_desc ?? "Steam rating"} · ${
        displayRating.positive_percent
      }% positive · ${displayRating.source ?? "Steam"}`}
    >
      {displayRating.positive_percent}%
    </span>
  );
}
function patchPropsForVisibleSidebarWrapper(props: unknown): unknown {
  if (!isSidebarVisibleWrapperProps(props)) {
    return props;
  }

  const obj = props as Record<string, unknown>;
  const existingClassName =
    typeof obj.className === "string" ? obj.className : "";

  return {
    ...obj,
    className: `${existingClassName} library-iq-sidebar-host`.trim()
  };
}

function maybeWrapSidebarIcon(
  originalJsx: JsxFn,
  type: unknown,
  props: unknown,
  key?: unknown
): unknown | null {
  const appid = getAppIdFromSidebarIconProps(props);

  if (!appid) {
    return null;
  }

  const icon = originalJsx(type, props, key);

  const badge = originalJsx(
    SteamSidebarRatingBadge,
    {
      appid
    },
    `library-iq-rating-${appid}`
  );

  return originalJsx(
    "span",
    {
      className: "library-iq-icon-rating-wrap",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "78px",
        minWidth: "78px",
        maxWidth: "78px",
        flex: "0 0 78px",
        gap: "7px",
        marginRight: "10px",
        paddingRight: "8px",
        boxSizing: "border-box",
        overflow: "visible",
        verticalAlign: "middle"
      },
      children: [icon, badge]
    },
    `library-iq-icon-rating-wrap-${appid}`
  );
}

function findJsxRuntime(req: WebpackRequire): {
  moduleId: string;
  runtime: Record<string, unknown>;
} | null {
  const moduleIds = Object.keys(req.m ?? {});
  const preferredIds = ["62540", "44846"];

  for (const id of [...preferredIds, ...moduleIds]) {
    try {
      const runtime = req(id) as Record<string, unknown>;

      if (
        runtime &&
        typeof runtime === "object" &&
        typeof runtime.jsx === "function" &&
        typeof runtime.jsxs === "function"
      ) {
        return {
          moduleId: String(id),
          runtime
        };
      }
    } catch {
      // Ignore modules that fail during require.
    }
  }

  return null;
}

function installSidebarRatingPatch(): string {
  if (installed) {
    return "already installed";
  }

  installStyles();

  const req = getWebpackRequire();

  if (!req) {
    return "failed to capture webpack require";
  }

  const found = findJsxRuntime(req);

  if (!found) {
    return "jsx runtime not found";
  }

  const originalJsx = found.runtime.jsx as JsxFn;
  const originalJsxs = found.runtime.jsxs as JsxFn;

  found.runtime.jsx = function patchedJsx(
    type: unknown,
    props: unknown,
    key?: unknown
  ) {
    const wrappedIcon = maybeWrapSidebarIcon(originalJsx, type, props, key);

    if (wrappedIcon) {
      return wrappedIcon;
    }

    const patchedProps = patchPropsForVisibleSidebarWrapper(props);
    return originalJsx(type, patchedProps, key);
  };

  found.runtime.jsxs = function patchedJsxs(
    type: unknown,
    props: unknown,
    key?: unknown
  ) {
    const wrappedIcon = maybeWrapSidebarIcon(originalJsx, type, props, key);

    if (wrappedIcon) {
      return wrappedIcon;
    }

    const patchedProps = patchPropsForVisibleSidebarWrapper(props);
    return originalJsxs(type, patchedProps, key);
  };

  installed = true;

  console.log("[LibraryIQ] Sidebar rating patch installed", {
    jsxModule: found.moduleId
  });

  return `installed via JSX module ${found.moduleId}`;
}

function SteamRatingsLibraryInjector() {
  useEffect(() => {
    const status = installSidebarRatingPatch();
    console.log("[LibraryIQ]", status);
  }, []);

  return <></>;
}

function steamRatingsLibrary() {
  return {
    SteamRatingsLibraryInjector
  };
}

Millennium.exposeObj({
  steamRatingsLibrary
});

export default definePlugin(() => {
  return {
    title: "LibraryIQ",
    icon: <span>★</span>,
    content: <div>LibraryIQ sidebar ratings are running.</div>
  };
});