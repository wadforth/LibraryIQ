import type { CSSProperties, ReactNode } from "react";
import {
  readSettings,
  useLibraryIqSettings
} from "../hooks/useLibraryIqSettings";
import {
  getAppIdFromProps,
  getAppIdFromSidebarIconProps,
  toNumber
} from "../services/steamAppStore";
import { findJsxRuntime, getWebpackRequire } from "../services/webpackRuntime";
import { installSidebarStyles } from "../styles/sidebarStyles";
import type { BadgePosition, JsxFn } from "../types";
import { SteamSidebarRatingBadge } from "../components/SteamSidebarRatingBadge";
import { getBadgeWidth } from "../styles/badgeVisuals";
import { markLibraryContextObserved } from "./libraryContext";
import { patchLibraryListProps } from "./libraryListPatch";

let installed = false;

type PatchedJsxFn = JsxFn & {
  __libraryIqPatched?: boolean;
  __libraryIqOriginal?: JsxFn;
};

type IconRatingSlotStyle = CSSProperties & {
  "--library-iq-icon-rating-width"?: string;
  "--library-iq-icon-badge-gap"?: string;
  "--library-iq-icon-rating-margin-right"?: string;
  "--library-iq-badge-title-spacing"?: string;
};

const SIDEBAR_ICON_SIZE_KEYS = [
  "width",
  "height",
  "nWidth",
  "nHeight",
  "unWidth",
  "unHeight",
  "imageWidth",
  "imageHeight"
];

const SIDEBAR_ROW_CLASS_TOKENS = [
  "_2-o4zg0krnsrzishbkctfq",
  "_1vo6boivslzgs1kqdgdus8"
];

const SIDEBAR_ICON_CLASS_TOKENS = ["ga1hyw11cdbvodrcaidpf"];

function isLibraryIqPatched(value: unknown): value is PatchedJsxFn {
  return Boolean(
    value &&
      typeof value === "function" &&
      (value as PatchedJsxFn).__libraryIqPatched
  );
}

function isSidebarVisibleWrapperProps(props: unknown): boolean {
  if (!props || typeof props !== "object") {
    return false;
  }

  const obj = props as Record<string, unknown>;
  const appid = getAppIdFromProps(props);
  const className = getStringValue(obj.className);

  if (!appid || appid === "0") {
    return false;
  }

  if (!SIDEBAR_ROW_CLASS_TOKENS.some((token) => className.includes(token))) {
    return false;
  }

  return (
    "appid" in obj &&
    "strCollectionId" in obj &&
    "includeMultiSelect" in obj &&
    "children" in obj
  );
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function isLikelySidebarIconAssetProps(props: unknown): boolean {
  if (!props || typeof props !== "object") {
    return false;
  }

  const obj = props as Record<string, unknown>;
  const assetType = String(obj.eAssetType ?? "").toLowerCase();
  const className = getStringValue(obj.className);
  const source = getStringValue(obj.src) || getStringValue(obj.imageUrl);
  let observedSmallSize = false;

  if (className.includes("hero") || className.includes("capsule")) {
    return false;
  }

  if (source.includes("library_hero") || source.includes("library_capsule")) {
    return false;
  }

  for (const key of SIDEBAR_ICON_SIZE_KEYS) {
    const size = toNumber(obj[key]);

    if (size !== null && size > 64) {
      return false;
    }

    if (size !== null && size > 0 && size <= 32) {
      observedSmallSize = true;
    }
  }

  return (
    assetType !== "" &&
    (observedSmallSize ||
      SIDEBAR_ICON_CLASS_TOKENS.some((token) => className.includes(token)))
  );
}

function buildSidebarBadge(
  originalJsx: JsxFn,
  appid: string,
  slot: BadgePosition
): unknown {
  return originalJsx(
    SteamSidebarRatingBadge,
    {
      appid,
      slot
    },
    `library-iq-rating-${slot}-${appid}`
  );
}

function childHasLibraryIqBadge(child: unknown): boolean {
  if (!child || typeof child !== "object") {
    return false;
  }

  const key = (child as Record<string, unknown>).key;

  return typeof key === "string" && key.startsWith("library-iq-rating-");
}

function insertSidebarBadge(
  originalJsx: JsxFn,
  children: unknown,
  appid: string,
  slot: BadgePosition
): unknown {
  const badge = buildSidebarBadge(originalJsx, appid, slot);

  if (Array.isArray(children)) {
    if (children.some(childHasLibraryIqBadge)) {
      return children;
    }

    if (slot === "beforeIcon") {
      return [badge, ...children];
    }

    if (slot === "betweenIconAndTitle") {
      const [firstChild, ...restChildren] = children;
      return [firstChild, badge, ...restChildren];
    }

    return [...children, badge];
  }

  if (!children) {
    return [badge];
  }

  return slot === "beforeIcon" ? [badge, children] : [children, badge];
}

function patchPropsForVisibleSidebarWrapper(
  originalJsx: JsxFn,
  props: unknown
): unknown {
  if (!isSidebarVisibleWrapperProps(props)) {
    return props;
  }

  const appid = getAppIdFromProps(props);

  if (!appid) {
    return props;
  }

  markLibraryContextObserved();

  const settings = readSettings();
  const slot = settings.compatibilityMode ? "afterTitle" : settings.badgePosition;
  const obj = props as Record<string, unknown>;
  const existingClassName =
    typeof obj.className === "string" ? obj.className : "";

  return {
    ...obj,
    className: `${existingClassName} library-iq-sidebar-host library-iq-sidebar-host-${slot}`.trim(),
    children:
      slot === "afterTitle"
        ? insertSidebarBadge(originalJsx, obj.children, appid, slot)
        : obj.children
  };
}

function LibraryIqIconRatingSlot({
  icon,
  appid
}: {
  icon: ReactNode;
  appid: string;
}) {
  const [settings] = useLibraryIqSettings();
  const iconWidth = 24;
  const iconBadgeGap = 7;

  if (
    !settings.showRatings ||
    settings.compatibilityMode ||
    settings.badgePosition === "afterTitle"
  ) {
    return <>{icon}</>;
  }

  const badgeWidth = getBadgeWidth(settings.badgeDisplayMode);
  const numericBadgeWidth = Number.parseInt(badgeWidth, 10) || 40;

  if (settings.badgePosition === "beforeIcon") {
    const wrapperWidth = numericBadgeWidth + settings.badgeTitleSpacing + iconWidth;

    return (
      <div
        className="library-iq-icon-rating-wrap"
        style={
          {
            "--library-iq-icon-rating-width": `${wrapperWidth}px`,
            "--library-iq-icon-badge-gap": "0px",
            "--library-iq-icon-rating-margin-right": "10px",
            "--library-iq-badge-title-spacing": "0px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: `${wrapperWidth}px`,
            minWidth: `${wrapperWidth}px`,
            maxWidth: `${wrapperWidth}px`,
            flex: `0 0 ${wrapperWidth}px`,
            gap: "0px",
            marginRight: "10px",
            paddingRight: "0px",
            boxSizing: "border-box",
            overflow: "visible",
            verticalAlign: "middle"
          } as IconRatingSlotStyle
        }
      >
        <SteamSidebarRatingBadge appid={appid} slot="beforeIcon" />
        {icon}
      </div>
    );
  }

  const wrapperWidth =
    iconWidth + iconBadgeGap + numericBadgeWidth + settings.badgeTitleSpacing;

  return (
    <div
      className="library-iq-icon-rating-wrap"
      style={
        {
          "--library-iq-icon-rating-width": `${wrapperWidth}px`,
          "--library-iq-icon-badge-gap": `${iconBadgeGap}px`,
          "--library-iq-icon-rating-margin-right": "0px",
          "--library-iq-badge-title-spacing": `${settings.badgeTitleSpacing}px`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: `${wrapperWidth}px`,
          minWidth: `${wrapperWidth}px`,
          maxWidth: `${wrapperWidth}px`,
          flex: `0 0 ${wrapperWidth}px`,
          gap: `${iconBadgeGap}px`,
          marginRight: "0px",
          paddingRight: `${settings.badgeTitleSpacing}px`,
          boxSizing: "border-box",
          overflow: "visible",
          verticalAlign: "middle"
        } as IconRatingSlotStyle
      }
    >
      {icon}
      <SteamSidebarRatingBadge appid={appid} slot="betweenIconAndTitle" />
    </div>
  );
}

function maybeWrapSidebarIcon(
  originalJsx: JsxFn,
  type: unknown,
  props: unknown,
  key?: unknown
): unknown | null {
  const settings = readSettings();

  if (
    !settings.showRatings ||
    settings.compatibilityMode ||
    settings.badgePosition === "afterTitle" ||
    !isLikelySidebarIconAssetProps(props)
  ) {
    return null;
  }

  const appid = getAppIdFromSidebarIconProps(props);

  if (!appid) {
    return null;
  }

  markLibraryContextObserved();

  const icon = originalJsx(type, props, key) as ReactNode;

  return originalJsx(
    LibraryIqIconRatingSlot,
    {
      icon,
      appid
    },
    `library-iq-icon-rating-slot-${appid}`
  );
}

export function installSidebarRatingPatch(): string {
  installSidebarStyles();

  const req = getWebpackRequire();

  if (!req) {
    return "failed to capture webpack require";
  }

  const found = findJsxRuntime(req);

  if (!found) {
    return "jsx runtime not found";
  }

  const wasInstalled = installed;
  const originalJsx = found.runtime.jsx as JsxFn;
  const originalJsxs = found.runtime.jsxs as JsxFn;

  if (isLibraryIqPatched(originalJsx) && isLibraryIqPatched(originalJsxs)) {
    installed = true;
    return "already installed";
  }

  const baseJsx = isLibraryIqPatched(originalJsx)
    ? originalJsx.__libraryIqOriginal ?? originalJsx
    : originalJsx;
  const baseJsxs = isLibraryIqPatched(originalJsxs)
    ? originalJsxs.__libraryIqOriginal ?? originalJsxs
    : originalJsxs;

  // Steam's Library UI is rendered through this bundled JSX runtime, so
  // patching jsx/jsxs lets LibraryIQ augment rows without direct DOM injection.
  const patchedJsx = function patchedJsx(
    type: unknown,
    props: unknown,
    key?: unknown
  ) {
    try {
      const listPatchedProps = patchLibraryListProps(props);

      const wrappedIcon = maybeWrapSidebarIcon(
        baseJsx,
        type,
        listPatchedProps,
        key
      );

      if (wrappedIcon) {
        return wrappedIcon;
      }

      const patchedProps = patchPropsForVisibleSidebarWrapper(
        baseJsx,
        listPatchedProps
      );

      return baseJsx(type, patchedProps, key);
    } catch (error) {
      console.error(
        "[LibraryIQ] JSX patch failed; returning original element",
        error
      );
      return baseJsx(type, props, key);
    }
  } as PatchedJsxFn;

  patchedJsx.__libraryIqPatched = true;
  patchedJsx.__libraryIqOriginal = baseJsx;

  found.runtime.jsx = patchedJsx;

  const patchedJsxs = function patchedJsxs(
    type: unknown,
    props: unknown,
    key?: unknown
  ) {
    try {
      const listPatchedProps = patchLibraryListProps(props);

      const wrappedIcon = maybeWrapSidebarIcon(
        baseJsx,
        type,
        listPatchedProps,
        key
      );

      if (wrappedIcon) {
        return wrappedIcon;
      }

      const patchedProps = patchPropsForVisibleSidebarWrapper(
        baseJsx,
        listPatchedProps
      );

      return baseJsxs(type, patchedProps, key);
    } catch (error) {
      console.error(
        "[LibraryIQ] JSXS patch failed; returning original element",
        error
      );
      return baseJsxs(type, props, key);
    }
  } as PatchedJsxFn;

  patchedJsxs.__libraryIqPatched = true;
  patchedJsxs.__libraryIqOriginal = baseJsxs;

  found.runtime.jsxs = patchedJsxs;

  installed = true;

  return wasInstalled
    ? `reinstalled via JSX module ${found.moduleId}`
    : `installed via JSX module ${found.moduleId}`;
}
