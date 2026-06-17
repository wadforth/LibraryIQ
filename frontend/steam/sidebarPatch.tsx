import type { CSSProperties, ReactNode } from "react";
import { useLibraryIqSettings } from "../hooks/useLibraryIqSettings";
import {
  getAppIdFromProps,
  getAppIdFromSidebarIconProps
} from "../services/steamAppStore";
import { findJsxRuntime, getWebpackRequire } from "../services/webpackRuntime";
import { installSidebarStyles } from "../styles/sidebarStyles";
import type { JsxFn } from "../types";
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

function appendAfterTitleBadge(
  originalJsx: JsxFn,
  children: unknown,
  appid: string
): unknown {
  const badgeKey = `library-iq-rating-after-title-${appid}`;

  const badge = originalJsx(
    SteamSidebarRatingBadge,
    {
      appid,
      slot: "afterTitle"
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

  const obj = props as Record<string, unknown>;
  const existingClassName =
    typeof obj.className === "string" ? obj.className : "";

  return {
    ...obj,
    className: `${existingClassName} library-iq-sidebar-host`.trim(),
    children: appendAfterTitleBadge(originalJsx, obj.children, appid)
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

  if (!settings.showRatings || settings.badgePosition === "afterTitle") {
    return (
      <span
        className="library-iq-icon-rating-wrap"
        style={
          {
          "--library-iq-icon-rating-width": `${iconWidth}px`,
          "--library-iq-icon-badge-gap": "0px",
          "--library-iq-icon-rating-margin-right": "10px",
          "--library-iq-badge-title-spacing": "0px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: `${iconWidth}px`,
          minWidth: `${iconWidth}px`,
          maxWidth: `${iconWidth}px`,
          flex: `0 0 ${iconWidth}px`,
          marginRight: "10px",
          boxSizing: "border-box",
          overflow: "visible",
          verticalAlign: "middle"
          } as IconRatingSlotStyle
        }
      >
        {icon}
      </span>
    );
  }

  const badgeWidth = getBadgeWidth(settings.badgeDisplayMode);
  const wrapperWidth =
    iconWidth + iconBadgeGap + badgeWidth + settings.badgeTitleSpacing;

  return (
    <span
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
    </span>
  );
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
