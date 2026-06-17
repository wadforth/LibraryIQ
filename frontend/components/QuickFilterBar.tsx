import { useEffect, useState } from "react";
import type { CSSProperties, MouseEvent, SyntheticEvent } from "react";
import { useLibraryIqSettings } from "../hooks/useLibraryIqSettings";
import {
  addLibraryContextListener,
  getLastLibraryContextObservedAt
} from "../steam/libraryContext";
import type { LibraryIqSettings, RatingSortMode } from "../types";

const LIBRARY_CONTEXT_GRACE_MS = 5000;

const minimumOptions: Array<{ label: string; value: number | null }> = [
  { label: "Off", value: null },
  { label: "70+", value: 70 },
  { label: "80+", value: 80 },
  { label: "90+", value: 90 }
];

const sortOptions: Array<{ label: string; value: RatingSortMode }> = [
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

  return (
    lastObservedAt > 0 && Date.now() - lastObservedAt < LIBRARY_CONTEXT_GRACE_MS
  );
}

function buttonStyle(active: boolean): CSSProperties {
  return {
    padding: "5px 8px",
    borderRadius: "8px",
    border: active
      ? "1px solid rgba(128,190,255,0.42)"
      : "1px solid rgba(255,255,255,0.10)",
    background: active
      ? "linear-gradient(180deg, rgba(54,95,139,0.96), rgba(35,63,96,0.96))"
      : "rgba(8,13,20,0.72)",
    color: active ? "rgba(255,255,255,0.98)" : "rgba(220,230,242,0.76)",
    fontSize: "11px",
    fontWeight: 850,
    cursor: "pointer",
    lineHeight: 1,
    boxShadow: active ? "0 1px 5px rgba(0,0,0,0.22)" : "none"
  };
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

export function QuickFilterBar() {
  const [settings, setSettings] = useLibraryIqSettings();

  const [isLibraryContext, setIsLibraryContext] = useState(() =>
    isInSteamLibraryContext()
  );

  // Always start collapsed on Steam reload.
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const updateLibraryContext = () => {
      setIsLibraryContext(isInSteamLibraryContext());
    };

    const removeLibraryContextListener =
      addLibraryContextListener(updateLibraryContext);

    const intervalId = window.setInterval(() => {
      updateLibraryContext();
    }, 700);

    return () => {
      removeLibraryContextListener();
      window.clearInterval(intervalId);
    };
  }, []);

  if (!settings.showQuickFilterBar || !isLibraryContext) {
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

    return (
      <div
        {...wrapperEvents}
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
            padding: collapsedLabel ? "0 8px" : "0 7px",
            borderRadius: "8px",
            border: active
              ? "1px solid rgba(120,180,255,0.44)"
              : "1px solid rgba(255,255,255,0.13)",
            background: active
              ? "linear-gradient(180deg, rgba(37,75,113,0.96), rgba(25,48,76,0.96))"
              : "linear-gradient(180deg, rgba(51,62,76,0.96), rgba(34,42,54,0.96))",
            boxShadow: "0 3px 10px rgba(0,0,0,0.30)",
            color: "rgba(240,247,255,0.96)",
            fontSize: "11px",
            fontWeight: 900,
            cursor: "pointer"
          }}
          title={`LibraryIQ quick filter: ${getActiveLabel(settings)}`}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "20px",
              height: "20px",
              borderRadius: "7px",
              background:
                "linear-gradient(135deg, rgba(91,145,210,0.95), rgba(53,91,145,0.84))",
              color: "white",
              fontSize: "10px",
              fontWeight: 950
            }}
          >
            IQ
          </span>

          {collapsedLabel ? (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 900,
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

  return (
    <div
      {...wrapperEvents}
      style={{
        position: "fixed",
        left: `${settings.quickFilterPanelLeft}px`,
        top: `${settings.quickFilterPanelTop}px`,
        zIndex: 2147483600,
        width: "258px",
        boxSizing: "border-box",
        padding: "9px",
        borderRadius: "13px",
        background:
          "linear-gradient(180deg, rgba(20,30,42,0.98), rgba(10,16,24,0.98))",
        border: active
          ? "1px solid rgba(120,180,255,0.42)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 10px 26px rgba(0,0,0,0.38)",
        color: "#dbe5f2",
        fontFamily: "Arial, Helvetica, sans-serif",
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
            display: "flex",
            alignItems: "center",
            gap: "7px",
            minWidth: 0
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "9px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(91,145,210,0.95), rgba(53,91,145,0.84))",
              color: "white",
              fontSize: "12px",
              fontWeight: 950
            }}
          >
            IQ
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: "rgba(255,255,255,0.96)",
                fontSize: "12px",
                fontWeight: 900,
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
                fontWeight: 750,
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
              ...buttonStyle(false),
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
              ...buttonStyle(active),
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
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: "0.45px"
          }}
        >
          Minimum rating
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          {minimumOptions.map((option) => (
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
              style={buttonStyle(settings.minimumRating === option.value)}
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
            fontWeight: 850,
            textTransform: "uppercase",
            letterSpacing: "0.45px"
          }}
        >
          Sort by rating
        </div>

        <div style={{ display: "flex", gap: "5px" }}>
          {sortOptions.map((option) => (
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
              style={buttonStyle(settings.ratingSortMode === option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
