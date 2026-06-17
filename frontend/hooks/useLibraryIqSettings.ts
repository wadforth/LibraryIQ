import { useEffect, useState } from "react";
import type { LibraryIqSettings } from "../types";

export const SETTINGS_STORAGE_KEY = "library-iq-settings-v1";
export const SETTINGS_EVENT = "library-iq-settings-changed";

export const DEFAULT_SETTINGS: LibraryIqSettings = {
  showRatings: true,
  ratingSource: "filtered",
  colourMode: "coloured",
  showTooltip: true,
  badgePosition: "betweenIconAndTitle",
  minimumRating: null,
  ratingSortMode: "off",

  showQuickFilterBar: true,
  quickFilterCollapsedLeft: 236,
  quickFilterCollapsedTop: 124,
  quickFilterPanelLeft: 12,
  quickFilterPanelTop: 86,

  badgeClickAction: "reviews",
  badgeDisplayMode: "percentage",
  badgePillStyle: "glass",
  badgeShape: "pill"
};

function readNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

export function readSettings(): LibraryIqSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<LibraryIqSettings>;

    return {
      showRatings:
        typeof parsed.showRatings === "boolean"
          ? parsed.showRatings
          : DEFAULT_SETTINGS.showRatings,

      ratingSource:
        parsed.ratingSource === "filtered" ||
        parsed.ratingSource === "unfiltered" ||
        parsed.ratingSource === "api"
          ? parsed.ratingSource
          : DEFAULT_SETTINGS.ratingSource,

      colourMode:
        parsed.colourMode === "coloured" || parsed.colourMode === "neutral"
          ? parsed.colourMode
          : DEFAULT_SETTINGS.colourMode,

      showTooltip:
        typeof parsed.showTooltip === "boolean"
          ? parsed.showTooltip
          : DEFAULT_SETTINGS.showTooltip,

      badgePosition:
        parsed.badgePosition === "betweenIconAndTitle" ||
        parsed.badgePosition === "afterTitle"
          ? parsed.badgePosition
          : DEFAULT_SETTINGS.badgePosition,

      minimumRating:
        typeof parsed.minimumRating === "number" &&
        Number.isFinite(parsed.minimumRating)
          ? parsed.minimumRating
          : null,

      ratingSortMode:
        parsed.ratingSortMode === "highestFirst" ||
        parsed.ratingSortMode === "lowestFirst" ||
        parsed.ratingSortMode === "off"
          ? parsed.ratingSortMode
          : DEFAULT_SETTINGS.ratingSortMode,

      showQuickFilterBar:
        typeof parsed.showQuickFilterBar === "boolean"
          ? parsed.showQuickFilterBar
          : DEFAULT_SETTINGS.showQuickFilterBar,

      quickFilterCollapsedLeft: readNumber(
        parsed.quickFilterCollapsedLeft,
        DEFAULT_SETTINGS.quickFilterCollapsedLeft,
        0,
        900
      ),

      quickFilterCollapsedTop: readNumber(
        parsed.quickFilterCollapsedTop,
        DEFAULT_SETTINGS.quickFilterCollapsedTop,
        40,
        700
      ),

      quickFilterPanelLeft: readNumber(
        parsed.quickFilterPanelLeft,
        DEFAULT_SETTINGS.quickFilterPanelLeft,
        0,
        900
      ),

      quickFilterPanelTop: readNumber(
        parsed.quickFilterPanelTop,
        DEFAULT_SETTINGS.quickFilterPanelTop,
        40,
        700
      ),

      badgeClickAction:
        parsed.badgeClickAction === "none" ||
        parsed.badgeClickAction === "reviews" ||
        parsed.badgeClickAction === "store"
          ? parsed.badgeClickAction
          : DEFAULT_SETTINGS.badgeClickAction,

      badgeDisplayMode:
        parsed.badgeDisplayMode === "percentage" ||
        parsed.badgeDisplayMode === "compact" ||
        parsed.badgeDisplayMode === "label"
          ? parsed.badgeDisplayMode
          : DEFAULT_SETTINGS.badgeDisplayMode,

      badgePillStyle:
        parsed.badgePillStyle === "glass" ||
        parsed.badgePillStyle === "solid" ||
        parsed.badgePillStyle === "outline" ||
        parsed.badgePillStyle === "steam"
          ? parsed.badgePillStyle
          : DEFAULT_SETTINGS.badgePillStyle,

      badgeShape:
        parsed.badgeShape === "pill" ||
        parsed.badgeShape === "squircle" ||
        parsed.badgeShape === "rounded" ||
        parsed.badgeShape === "square"
          ? parsed.badgeShape
          : DEFAULT_SETTINGS.badgeShape
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function forceSteamLibraryListRefresh() {
  window.dispatchEvent(new Event("resize"));
  window.dispatchEvent(new Event("scroll"));

  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
  }, 80);

  window.setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
    window.dispatchEvent(new Event("scroll"));
  }, 180);
}

export function writeSettings(settings: LibraryIqSettings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }));

  forceSteamLibraryListRefresh();
}

export function useLibraryIqSettings() {
  const [settings, setSettingsState] = useState<LibraryIqSettings>(() =>
    readSettings()
  );

  useEffect(() => {
    const listener = () => {
      setSettingsState(readSettings());
    };

    window.addEventListener(SETTINGS_EVENT, listener);
    window.addEventListener("storage", listener);

    return () => {
      window.removeEventListener(SETTINGS_EVENT, listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  function setSettings(next: LibraryIqSettings) {
    writeSettings(next);
    setSettingsState(next);
  }

  return [settings, setSettings] as const;
}