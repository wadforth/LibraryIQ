import { callable } from "@steambrew/client";
import { debugLogOnce } from "./debug";
import type { BadgePosition } from "../types";

type LibraryIqWindow = Window & {
  __LIBRARYIQ_ACTIVE_THEME__?: string;
};

let hasRequestedActiveTheme = false;
let resolvedActiveTheme = "";
let resolvedActiveThemeRepo = "";

const THEME_COMPATIBILITY_EVENT = "library-iq-theme-compatibility-changed";
const getActiveTheme = callable<[], string>("get_active_theme");

function getInjectedActiveTheme(): string {
  return String(
    resolvedActiveTheme ||
      (window as LibraryIqWindow).__LIBRARYIQ_ACTIVE_THEME__ ||
      ""
  ).toLowerCase();
}

function getResolvedThemeSignature(): string {
  return `${getInjectedActiveTheme()} ${resolvedActiveThemeRepo.toLowerCase()}`;
}

function setMinimalDarkActive(active: boolean) {
  document.documentElement.classList.toggle(
    "library-iq-theme-minimal-dark-active",
    active
  );
}

function notifyThemeCompatibilityChanged() {
  window.dispatchEvent(new Event(THEME_COMPATIBILITY_EVENT));
}

export function addThemeCompatibilityListener(listener: () => void) {
  window.addEventListener(THEME_COMPATIBILITY_EVENT, listener);

  return () => {
    window.removeEventListener(THEME_COMPATIBILITY_EVENT, listener);
  };
}

export function ensureThemeCompatibilityLoaded() {
  if (hasRequestedActiveTheme) {
    return;
  }

  hasRequestedActiveTheme = true;

  getActiveTheme()
    .then((raw) => {
      const parsed = JSON.parse(raw) as {
        ok?: boolean;
        activeTheme?: string;
        activeThemeRepo?: string;
      };

      resolvedActiveTheme = String(parsed.activeTheme ?? "");
      resolvedActiveThemeRepo = String(parsed.activeThemeRepo ?? "");

      debugLogOnce(
        "backend-active-theme",
        "themeCompatibility",
        "resolved active theme from backend",
        {
          activeTheme: resolvedActiveTheme || null,
          activeThemeRepo: resolvedActiveThemeRepo || null
        }
      );

      setMinimalDarkActive(isMinimalDarkActive());
      notifyThemeCompatibilityChanged();
    })
    .catch((error) => {
      debugLogOnce(
        "backend-active-theme-failed",
        "themeCompatibility",
        "failed to resolve active theme from backend",
        { error: String(error) }
      );

      setMinimalDarkActive(isMinimalDarkActive());
      notifyThemeCompatibilityChanged();
    });
}

export function isSpaceThemeActive(): boolean {
  const themeSignature = getResolvedThemeSignature();
  const activeTheme = getInjectedActiveTheme();
  const rootStyle = window.getComputedStyle(document.documentElement);
  const hasSpaceThemeVariables = Boolean(
    rootStyle.getPropertyValue("--st-background").trim() &&
      rootStyle.getPropertyValue("--st-color-2").trim()
  );
  const hasSpaceThemeName =
    themeSignature.includes("spacetheme") || activeTheme === "steam";

  if (hasSpaceThemeVariables || hasSpaceThemeName) {
    debugLogOnce("space-theme-detected", "themeCompatibility", "detected SpaceTheme CSS variables");
  }

  return hasSpaceThemeVariables || hasSpaceThemeName;
}

export function isMinimalDarkActive(): boolean {
  const themeSignature = getResolvedThemeSignature();
  const hasMinimalDarkThemeName = themeSignature.includes("minimal-dark");

  setMinimalDarkActive(hasMinimalDarkThemeName);

  if (hasMinimalDarkThemeName) {
    debugLogOnce(
      "minimal-dark-detected",
      "themeCompatibility",
      "detected Minimal Dark theme",
      {
        activeTheme: resolvedActiveTheme || null,
        activeThemeRepo: resolvedActiveThemeRepo || null
      }
    );
  }

  return hasMinimalDarkThemeName;
}

export function getThemeSafeSidebarBadgePosition(
  badgePosition: BadgePosition
): BadgePosition {
  if (isMinimalDarkActive() && badgePosition === "afterTitle") {
    debugLogOnce(
      "minimal-dark-after-title-disabled",
      "themeCompatibility",
      "disabled after-title badge position for Minimal Dark"
    );

    return "betweenIconAndTitle";
  }

  return badgePosition;
}
