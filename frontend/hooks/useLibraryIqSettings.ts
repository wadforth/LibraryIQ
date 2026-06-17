import { useEffect, useState } from "react";
import type { LibraryIqSettings } from "../types";

export const SETTINGS_STORAGE_KEY = "library-iq-settings-v1";
export const SETTINGS_EVENT = "library-iq-settings-changed";

export const QUICK_FILTER_POSITION_LIMITS = {
  collapsedLeft: { min: 0, max: 600 },
  collapsedTop: { min: 40, max: 500 },
  panelLeft: { min: 0, max: 600 },
  panelTop: { min: 40, max: 500 }
} as const;

export const BADGE_TITLE_SPACING_LIMITS = {
  min: 0,
  max: 20
} as const;

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
  badgeShape: "pill",
  badgeTitleSpacing: 5
};

function readNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const numericValue = typeof value === "string" ? Number(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numericValue)));
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readOptionalPercentage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = typeof value === "string" ? Number(value) : value;

  if (typeof numericValue !== "number" || !Number.isFinite(numericValue)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

export function normalizeSettings(value: unknown): LibraryIqSettings {
  const parsed = readObject(value);

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

    minimumRating: readOptionalPercentage(parsed.minimumRating),

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
      QUICK_FILTER_POSITION_LIMITS.collapsedLeft.min,
      QUICK_FILTER_POSITION_LIMITS.collapsedLeft.max
    ),

    quickFilterCollapsedTop: readNumber(
      parsed.quickFilterCollapsedTop,
      DEFAULT_SETTINGS.quickFilterCollapsedTop,
      QUICK_FILTER_POSITION_LIMITS.collapsedTop.min,
      QUICK_FILTER_POSITION_LIMITS.collapsedTop.max
    ),

    quickFilterPanelLeft: readNumber(
      parsed.quickFilterPanelLeft,
      DEFAULT_SETTINGS.quickFilterPanelLeft,
      QUICK_FILTER_POSITION_LIMITS.panelLeft.min,
      QUICK_FILTER_POSITION_LIMITS.panelLeft.max
    ),

    quickFilterPanelTop: readNumber(
      parsed.quickFilterPanelTop,
      DEFAULT_SETTINGS.quickFilterPanelTop,
      QUICK_FILTER_POSITION_LIMITS.panelTop.min,
      QUICK_FILTER_POSITION_LIMITS.panelTop.max
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
        : DEFAULT_SETTINGS.badgeShape,

    badgeTitleSpacing: readNumber(
      parsed.badgeTitleSpacing,
      DEFAULT_SETTINGS.badgeTitleSpacing,
      BADGE_TITLE_SPACING_LIMITS.min,
      BADGE_TITLE_SPACING_LIMITS.max
    )
  };
}

export function readSettings(): LibraryIqSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    return normalizeSettings(JSON.parse(raw));
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
  const normalizedSettings = normalizeSettings(settings);

  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizedSettings)
  );
  window.dispatchEvent(
    new CustomEvent(SETTINGS_EVENT, { detail: normalizedSettings })
  );

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
    const normalizedSettings = normalizeSettings(next);

    writeSettings(normalizedSettings);
    setSettingsState(normalizedSettings);
  }

  return [settings, setSettings] as const;
}
