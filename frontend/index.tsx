import { Millennium, callable, definePlugin } from "@steambrew/client";
import { useEffect, useState } from "react";

type WebpackRequire = ((id: number | string) => unknown) & {
  m?: Record<string, unknown>;
  c?: Record<string, unknown>;
};

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
  error?: string;
  detail?: string;
};

const getSteamRating = callable<[{ appid: string }], string>("get_steam_rating");

const STYLE_ID = "steam-ratings-sidebar-real-style";

let installed = false;

const ratingCache = new Map<string, SteamRatingResponse>();
const pendingRatings = new Map<string, Promise<SteamRatingResponse>>();

function installStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .sr-sidebar-real-host {
      display: flex !important;
      align-items: center !important;
      min-width: 0 !important;
      width: 100% !important;
    }

    .sr-sidebar-real-host .sr-sidebar-real-rating {
      margin-left: auto !important;
      margin-right: 6px !important;
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
      [`steam-ratings-sidebar-rating-${Date.now()}`],
      {},
      (req: WebpackRequire) => {
        capturedRequire = req;
      }
    ]);

    return capturedRequire;
  } catch (error) {
    console.error("[Steam Ratings] Failed to capture webpack require", error);
    return null;
  }
}

function getAppIdFromProps(props: unknown): string | null {
  if (!props || typeof props !== "object") {
    return null;
  }

  const obj = props as Record<string, unknown>;
  const appid = obj.appid;

  if (
    typeof appid === "number" ||
    (typeof appid === "string" && /^\d+$/.test(appid))
  ) {
    return String(appid);
  }

  return null;
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
    obj.review_percentage_with_bombs ??
    obj.review_percentage_without_bombs ??
    obj.review_percentage ??
    obj.m_review_percentage_with_bombs ??
    obj.m_review_percentage_without_bombs;

  const scoreDesc =
    obj.review_score_with_bombs ??
    obj.review_score_without_bombs ??
    obj.review_score_desc ??
    obj.m_review_score_with_bombs ??
    obj.m_review_score_without_bombs;

  if (typeof percentage !== "number") {
    return null;
  }

  return {
    ok: true,
    appid,
    positive_percent: percentage,
    review_score_desc: typeof scoreDesc === "string" ? scoreDesc : "Steam rating"
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
      ratingCache.set(appid, rating);
      pendingRatings.delete(appid);
      return rating;
    })
    .catch((error) => {
      const failed: SteamRatingResponse = {
        ok: false,
        appid,
        error: "frontend_fetch_failed",
        detail: String(error)
      };

      ratingCache.set(appid, failed);
      pendingRatings.delete(appid);

      return failed;
    });

  pendingRatings.set(appid, request);

  return request;
}

function getBadgeBackground(rating: SteamRatingResponse | null): string {
  if (!rating || !rating.ok || typeof rating.positive_percent !== "number") {
    return "rgba(75, 78, 86, 0.92)";
  }

  if (rating.positive_percent >= 75) {
    return "rgba(34, 91, 49, 0.95)";
  }

  if (rating.positive_percent >= 50) {
    return "rgba(113, 86, 30, 0.95)";
  }

  return "rgba(120, 38, 38, 0.95)";
}

function getBadgeText(rating: SteamRatingResponse | null): string {
  if (!rating) {
    return "...";
  }

  if (!rating.ok || typeof rating.positive_percent !== "number") {
    return "?";
  }

  return `${rating.positive_percent}%`;
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

  return (
    <span
      className="sr-sidebar-real-rating"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        float: "right",
        marginLeft: "8px",
        marginRight: "6px",
        minWidth: "34px",
        maxWidth: "42px",
        height: "17px",
        padding: "0 4px",
        borderRadius: "5px",
        boxSizing: "border-box",
        fontFamily: "inherit",
        fontSize: "10px",
        fontWeight: 800,
        lineHeight: 1,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        color: "rgba(255, 255, 255, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.28)",
        background: getBadgeBackground(rating)
      }}
      title={
        rating?.ok
          ? `${rating.review_score_desc ?? "Steam rating"} - ${rating.positive_percent ?? "N/A"}% positive`
          : rating?.error ?? "Rating unavailable"
      }
    >
      {getBadgeText(rating)}
    </span>
  );
}

function appendRatingBadgeToChildren(
  originalJsx: unknown,
  children: unknown,
  appid: string
): unknown {
  const badgeKey = `steam-rating-${appid}`;

  const badge = (originalJsx as Function)(
    SteamSidebarRatingBadge,
    {
      appid
    },
    badgeKey
  );

  if (Array.isArray(children)) {
    const alreadyHasBadge = children.some((child) => {
      if (!child || typeof child !== "object") {
        return false;
      }

      const obj = child as Record<string, unknown>;
      return obj.key === badgeKey;
    });

    if (alreadyHasBadge) {
      return children;
    }

    return [...children, badge];
  }

  if (!children) {
    return [badge];
  }

  return [children, badge];
}

function patchPropsForVisibleSidebarWrapper(
  originalJsx: unknown,
  props: unknown
): unknown {
  if (!isSidebarVisibleWrapperProps(props)) {
    return props;
  }

  const appid = getAppIdFromProps(props);

  if (!appid) {
    return props;
  }

  const obj = props as Record<string, unknown>;

  const existingClassName =
    typeof obj.className === "string" ? obj.className : "";

  return {
    ...obj,
    className: `${existingClassName} sr-sidebar-real-host`.trim(),
    children: appendRatingBadgeToChildren(originalJsx, obj.children, appid)
  };
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

  const originalJsx = found.runtime.jsx;
  const originalJsxs = found.runtime.jsxs;

  found.runtime.jsx = function patchedJsx(type: unknown, props: unknown, key?: unknown) {
    const patchedProps = patchPropsForVisibleSidebarWrapper(originalJsx, props);
    return (originalJsx as Function)(type, patchedProps, key);
  };

  found.runtime.jsxs = function patchedJsxs(type: unknown, props: unknown, key?: unknown) {
    const patchedProps = patchPropsForVisibleSidebarWrapper(originalJsx, props);
    return (originalJsxs as Function)(type, patchedProps, key);
  };

  installed = true;

  console.log("[Steam Ratings] Sidebar visible wrapper rating patch installed", {
    jsxModule: found.moduleId
  });

  return `installed via JSX module ${found.moduleId}`;
}

function SteamRatingsLibraryInjector() {
  useEffect(() => {
    const status = installSidebarRatingPatch();
    console.log("[Steam Ratings]", status);
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
    title: "Steam Ratings",
    icon: <span>★</span>,
    content: <div>Steam Ratings sidebar row patch is running.</div>
  };
});