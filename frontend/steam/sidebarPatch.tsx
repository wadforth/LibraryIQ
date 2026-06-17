import type { ReactNode } from "react";
import { useLibraryIqSettings } from "../hooks/useLibraryIqSettings";
import {
  getAppIdFromProps,
  getAppIdFromSidebarIconProps
} from "../services/steamAppStore";
import { findJsxRuntime, getWebpackRequire } from "../services/webpackRuntime";
import { installSidebarStyles } from "../styles/sidebarStyles";
import type { JsxFn } from "../types";
import { SteamSidebarRatingBadge } from "../components/SteamSidebarRatingBadge";
import { markLibraryContextObserved } from "./libraryContext";
import { patchLibraryListProps } from "./libraryListPatch";

let installed = false;

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

  if (!settings.showRatings || settings.badgePosition === "afterTitle") {
    return (
      <span
        className="library-iq-icon-rating-wrap"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "24px",
          minWidth: "24px",
          maxWidth: "24px",
          flex: "0 0 24px",
          marginRight: "10px",
          boxSizing: "border-box",
          overflow: "visible",
          verticalAlign: "middle"
        }}
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className="library-iq-icon-rating-wrap"
      style={{
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
      }}
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
  if (installed) {
    return "already installed";
  }

  installSidebarStyles();

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
    const listPatchedProps = patchLibraryListProps(props);

    const wrappedIcon = maybeWrapSidebarIcon(
      originalJsx,
      type,
      listPatchedProps,
      key
    );

    if (wrappedIcon) {
      return wrappedIcon;
    }

    const patchedProps = patchPropsForVisibleSidebarWrapper(
      originalJsx,
      listPatchedProps
    );

    return originalJsx(type, patchedProps, key);
  };

  found.runtime.jsxs = function patchedJsxs(
    type: unknown,
    props: unknown,
    key?: unknown
  ) {
    const listPatchedProps = patchLibraryListProps(props);

    const wrappedIcon = maybeWrapSidebarIcon(
      originalJsx,
      type,
      listPatchedProps,
      key
    );

    if (wrappedIcon) {
      return wrappedIcon;
    }

    const patchedProps = patchPropsForVisibleSidebarWrapper(
      originalJsx,
      listPatchedProps
    );

    return originalJsxs(type, patchedProps, key);
  };

  installed = true;

  console.log("[LibraryIQ] Sidebar rating patch installed", {
    jsxModule: found.moduleId
  });

  return `installed via JSX module ${found.moduleId}`;
}
