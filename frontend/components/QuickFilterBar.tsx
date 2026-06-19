import { useEffect, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode, SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { useLibraryIqSettings } from "../hooks/useLibraryIqSettings";
import { debugLog } from "../services/debug";
import {
  addThemeCompatibilityListener,
  ensureThemeCompatibilityLoaded,
  isMinimalDarkActive
} from "../services/themeCompatibility";
import {
  addLibraryContextListener,
  getLastLibraryContextObservedAt
} from "../steam/libraryContext";
import type { LibraryIqSettings, RatingSortMode } from "../types";

const minimumRatingOptions: Array<{ label: string; value: number | null }> = [
  { label: "Off", value: null },
  { label: "70+", value: 70 },
  { label: "80+", value: 80 },
  { label: "90+", value: 90 }
];

const ratingSortOptions: Array<{ label: string; value: RatingSortMode }> = [
  { label: "Off", value: "off" },
  { label: "High", value: "highestFirst" },
  { label: "Low", value: "lowestFirst" }
];

function stopSteamEvent(event: SyntheticEvent<HTMLElement>) {
  event.stopPropagation();

  const nativeEvent = event.nativeEvent as Event & {
    stopImmediatePropagation?: () => void;
  };

  nativeEvent.stopImmediatePropagation?.();
}

function stopSteamButtonClick(event: MouseEvent<HTMLElement>) {
  event.preventDefault();
  event.stopPropagation();

  const nativeEvent = event.nativeEvent as Event & {
    stopImmediatePropagation?: () => void;
  };

  nativeEvent.stopImmediatePropagation?.();
}

function isSteamWebPage() {
  const href = window.location.href.toLowerCase();

  return (
    href.includes("steamcommunity.com") ||
    href.includes("store.steampowered.com")
  );
}

function hasLibraryIqLibraryMarker() {
  return Boolean(
    document.querySelector(
      ".library-iq-sidebar-host, .library-iq-icon-rating-wrap"
    )
  );
}

function isInSteamLibraryContext() {
  if (isSteamWebPage()) {
    return false;
  }

  if (hasLibraryIqLibraryMarker()) {
    return true;
  }

  const lastObservedAt = getLastLibraryContextObservedAt();

  return lastObservedAt > 0;
}

function getQuickFilterButtonStyle(active: boolean): CSSProperties {
  return {
    padding: "5px 8px",
    borderRadius: "2px",
    border: active
      ? "1px solid rgba(102, 192, 244, 0.50)"
      : "1px solid rgba(103, 112, 123, 0.45)",
    background: active ? "rgba(42, 71, 94, 0.96)" : "rgba(35, 40, 46, 0.96)",
    color: active ? "rgba(255,255,255,0.98)" : "rgba(220,230,242,0.76)",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1,
    boxShadow: "none"
  };
}

function renderQuickFilterLayer(content: ReactNode) {
  if (isMinimalDarkActive() && document.body) {
    return createPortal(content, document.body);
  }

  return content;
}

function updateSetting<K extends keyof LibraryIqSettings>(
  settings: LibraryIqSettings,
  setSettings: (settings: LibraryIqSettings) => void,
  key: K,
  value: LibraryIqSettings[K]
) {
  setSettings({
    ...settings,
    [key]: value
  });
}

function getActiveLabel(settings: LibraryIqSettings) {
  const minimum =
    settings.minimumRating === null ? "All" : `${settings.minimumRating}%+`;

  const sort =
    settings.ratingSortMode === "highestFirst"
      ? "Highest"
      : settings.ratingSortMode === "lowestFirst"
        ? "Lowest"
        : "Steam";

  return `${minimum} · ${sort}`;
}

function getCollapsedLabel(settings: LibraryIqSettings) {
  if (settings.minimumRating !== null) {
    return `${settings.minimumRating}+`;
  }

  if (settings.ratingSortMode === "highestFirst") {
    return "High";
  }

  if (settings.ratingSortMode === "lowestFirst") {
    return "Low";
  }

  return "";
}

function getQuickFilterDebugSnapshot(
  settings: LibraryIqSettings,
  isLibraryContext: boolean,
  collapsed: boolean
) {
  const host = document.querySelector<HTMLElement>("[data-library-iq-quick-filter]");
  const rect = host?.getBoundingClientRect();
  const style = host ? window.getComputedStyle(host) : null;
  const lastObservedAt = getLastLibraryContextObservedAt();

  return {
    href: window.location.href,
    bodyClassName: document.body?.className ?? "",
    documentClassName: document.documentElement?.className ?? "",
    isMinimalDarkActive: isMinimalDarkActive(),
    showQuickFilterBar: settings.showQuickFilterBar,
    isLibraryContext,
    collapsed,
    hasLibraryMarker: hasLibraryIqLibraryMarker(),
    lastObservedAt,
    msSinceLibraryContext:
      lastObservedAt > 0 ? Math.round(Date.now() - lastObservedAt) : null,
    hostRect: rect
      ? {
          left: Math.round(rect.left),
          top: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        }
      : null,
    hostDisplay: style?.display ?? null,
    hostVisibility: style?.visibility ?? null,
    hostOpacity: style?.opacity ?? null,
    collapsedLeft: settings.quickFilterCollapsedLeft,
    collapsedTop: settings.quickFilterCollapsedTop,
    panelLeft: settings.quickFilterPanelLeft,
    panelTop: settings.quickFilterPanelTop
  };
}

export function QuickFilterBar() {
  const [settings, setSettings] = useLibraryIqSettings();
  const [, setThemeCompatibilityVersion] = useState(0);

  const [isLibraryContext, setIsLibraryContext] = useState(() =>
    isInSteamLibraryContext()
  );

  // Always start collapsed on Steam reload.
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    ensureThemeCompatibilityLoaded();

    const removeThemeCompatibilityListener = addThemeCompatibilityListener(() => {
      setThemeCompatibilityVersion((version) => version + 1);
    });

    debugLog("quickFilter", "mounted", {
      href: window.location.href,
      bodyClassName: document.body?.className ?? ""
    });

    const updateLibraryContext = () => {
      setIsLibraryContext(isInSteamLibraryContext());
    };

    // Steam client navigation does not always update window.location, so the
    // sidebar patch emits a Library-specific signal when real app rows render.
    const removeLibraryContextListener =
      addLibraryContextListener(updateLibraryContext);

    const intervalId = window.setInterval(() => {
      updateLibraryContext();
    }, 700);

    return () => {
      removeThemeCompatibilityListener();
      removeLibraryContextListener();
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    debugLog(
      "quickFilter",
      settings.showQuickFilterBar && isLibraryContext
        ? "visible state"
        : "hidden state",
      getQuickFilterDebugSnapshot(settings, isLibraryContext, collapsed)
    );
  }, [settings.showQuickFilterBar, isLibraryContext, collapsed]);

  if (!settings.showQuickFilterBar || !isLibraryContext) {
    return null;
  }

  if (isMinimalDarkActive()) {
    return null;
  }

  const active =
    settings.minimumRating !== null || settings.ratingSortMode !== "off";

  function clearFilters(event: MouseEvent<HTMLButtonElement>) {
    stopSteamButtonClick(event);

    setSettings({
      ...settings,
      minimumRating: null,
      ratingSortMode: "off"
    });
  }

  const wrapperEvents = {
    onClick: stopSteamEvent,
    onMouseDown: stopSteamEvent,
    onMouseUp: stopSteamEvent,
    onPointerDown: stopSteamEvent,
    onPointerUp: stopSteamEvent,
    onDoubleClick: stopSteamEvent,
    onContextMenu: stopSteamEvent
  };

  if (collapsed) {
    const collapsedLabel = getCollapsedLabel(settings);

    return renderQuickFilterLayer(
      <div
        {...wrapperEvents}
        data-library-iq-quick-filter="collapsed"
        style={{
          position: "fixed",
          left: `${settings.quickFilterCollapsedLeft}px`,
          top: `${settings.quickFilterCollapsedTop}px`,
          zIndex: 2147483600,
          pointerEvents: "auto",
          userSelect: "none",
          fontFamily: "Arial, Helvetica, sans-serif"
        }}
      >
        <button
          type="button"
          onClick={(event) => {
            stopSteamButtonClick(event);
            setCollapsed(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: collapsedLabel ? "6px" : "0",
            height: "28px",
            padding: "0 8px",
            borderRadius: "2px",
            border: active
              ? "1px solid rgba(102, 192, 244, 0.50)"
              : "1px solid rgba(103, 112, 123, 0.45)",
            background: active ? "rgba(42, 71, 94, 0.96)" : "rgba(35, 40, 46, 0.96)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            color: "rgba(240,247,255,0.96)",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer"
          }}
          title={`LibraryIQ quick filter: ${getActiveLabel(settings)}`}
        >
          <span>Filter</span>

          {collapsedLabel ? (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                color: "rgba(240,247,255,0.94)"
              }}
            >
              {collapsedLabel}
            </span>
          ) : null}
        </button>
      </div>
    );
  }

  return renderQuickFilterLayer(
    <div
      {...wrapperEvents}
      data-library-iq-quick-filter="expanded"
      style={{
        position: "fixed",
        left: `${settings.quickFilterPanelLeft}px`,
        top: `${settings.quickFilterPanelTop}px`,
        zIndex: 2147483600,
        width: "250px",
        boxSizing: "border-box",
        padding: "10px",
        borderRadius: "2px",
        background: "rgba(23, 29, 37, 0.98)",
        border: active
          ? "1px solid rgba(102, 192, 244, 0.45)"
          : "1px solid rgba(103, 112, 123, 0.45)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
        color: "#dbe5f2",
        fontFamily: "Motiva Sans, Arial, Helvetica, sans-serif",
        pointerEvents: "auto",
        userSelect: "none"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          marginBottom: "8px"
        }}
      >
        <div
          style={{
            minWidth: 0
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "rgba(255,255,255,0.96)",
                fontSize: "12px",
                fontWeight: 700,
                lineHeight: 1.1
              }}
            >
              Quick Filter
            </div>
            <div
              style={{
                color: active
                  ? "rgba(147,199,255,0.86)"
                  : "rgba(210,222,236,0.58)",
                fontSize: "10px",
                fontWeight: 600,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {getActiveLabel(settings)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          <button
            type="button"
            onClick={(event) => {
              stopSteamButtonClick(event);
              setCollapsed(true);
            }}
            style={{
              ...getQuickFilterButtonStyle(false),
              padding: "5px 7px"
            }}
            title="Collapse LibraryIQ quick filter"
          >
            –
          </button>

          <button
            type="button"
            onClick={clearFilters}
            style={{
              ...getQuickFilterButtonStyle(active),
              padding: "5px 7px",
              opacity: active ? 1 : 0.45
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "7px" }}>
        <div
          style={{
            marginBottom: "5px",
            color: "rgba(210,222,236,0.62)",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.45px"
          }}
        >
          Minimum rating
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          {minimumRatingOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={(event) => {
                stopSteamButtonClick(event);
                updateSetting(
                  settings,
                  setSettings,
                  "minimumRating",
                  option.value
                );
              }}
              style={getQuickFilterButtonStyle(
                settings.minimumRating === option.value
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            marginBottom: "5px",
            color: "rgba(210,222,236,0.62)",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.45px"
          }}
        >
          Sort by rating
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          {ratingSortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={(event) => {
                stopSteamButtonClick(event);
                updateSetting(
                  settings,
                  setSettings,
                  "ratingSortMode",
                  option.value
                );
              }}
              style={getQuickFilterButtonStyle(
                settings.ratingSortMode === option.value
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
