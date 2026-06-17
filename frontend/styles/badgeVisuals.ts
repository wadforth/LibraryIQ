import type { CSSProperties } from "react";
import type {
  BadgeDisplayMode,
  BadgePillStyle,
  BadgeShape,
  ColourMode
} from "../types";

type BadgeVisualSettings = {
  badgePillStyle: BadgePillStyle;
  colourMode: ColourMode;
};

type BadgeColours = {
  background: string;
  border: string;
  color: string;
  solid: string;
};

export function getBadgeDisplayLabel(displayMode: BadgeDisplayMode) {
  if (displayMode === "compact") {
    return "82";
  }

  if (displayMode === "label") {
    return "V+";
  }

  return "82%";
}

export function getBadgeWidth(displayMode: BadgeDisplayMode) {
  if (displayMode === "compact") {
    return "32px";
  }

  if (displayMode === "label") {
    return "34px";
  }

  return "40px";
}

export function getBadgeBorderRadius(badgeShape: BadgeShape) {
  if (badgeShape === "pill") {
    return "999px";
  }

  if (badgeShape === "squircle") {
    return "9px";
  }

  if (badgeShape === "rounded") {
    return "5px";
  }

  return "2px";
}

function getRatingTone(score: number) {
  if (score >= 85) {
    return "excellent";
  }

  if (score >= 70) {
    return "good";
  }

  if (score >= 50) {
    return "mixed";
  }

  return "poor";
}

function getBadgeColours(
  positivePercent: number,
  colourMode: ColourMode,
  pillStyle: BadgePillStyle
): BadgeColours {
  if (colourMode === "neutral" || pillStyle === "steam") {
    return {
      background: "rgba(72, 86, 103, 0.58)",
      border: "rgba(166, 185, 205, 0.32)",
      color: "rgba(236, 242, 248, 0.98)",
      solid: "rgba(67, 92, 121, 0.95)"
    };
  }

  const tone = getRatingTone(positivePercent);

  if (tone === "excellent") {
    return {
      background: "rgba(50, 116, 73, 0.62)",
      border: "rgba(121, 207, 145, 0.42)",
      color: "rgba(232, 255, 237, 0.98)",
      solid: "rgba(46, 132, 74, 0.96)"
    };
  }

  if (tone === "good") {
    return {
      background: "rgba(47, 100, 80, 0.56)",
      border: "rgba(106, 179, 143, 0.38)",
      color: "rgba(225, 250, 238, 0.96)",
      solid: "rgba(45, 111, 90, 0.96)"
    };
  }

  if (tone === "mixed") {
    return {
      background: "rgba(130, 95, 36, 0.62)",
      border: "rgba(214, 165, 83, 0.42)",
      color: "rgba(255, 239, 211, 0.96)",
      solid: "rgba(147, 101, 37, 0.96)"
    };
  }

  return {
    background: "rgba(126, 52, 52, 0.62)",
    border: "rgba(214, 104, 104, 0.42)",
    color: "rgba(255, 226, 226, 0.96)",
    solid: "rgba(137, 54, 54, 0.96)"
  };
}

export function getBadgeVisualStyle(
  positivePercent: number,
  settings: BadgeVisualSettings
): CSSProperties {
  const colours = getBadgeColours(
    positivePercent,
    settings.colourMode,
    settings.badgePillStyle
  );

  const base: CSSProperties = {
    color: colours.color,
    border: `1px solid ${colours.border}`,
    background: colours.background,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.24)"
  };

  if (settings.badgePillStyle === "solid") {
    return {
      ...base,
      background: colours.solid,
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.28)"
    };
  }

  if (settings.badgePillStyle === "outline") {
    return {
      ...base,
      background: "rgba(0,0,0,0.12)",
      border: `1px solid ${colours.border}`,
      boxShadow: "none"
    };
  }

  if (settings.badgePillStyle === "steam") {
    return {
      ...base,
      background:
        "linear-gradient(180deg, rgba(79,96,116,0.74), rgba(45,57,72,0.74))",
      border: "1px solid rgba(180,196,216,0.20)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.07), 0 1px 2px rgba(0,0,0,0.22)"
    };
  }

  return base;
}
