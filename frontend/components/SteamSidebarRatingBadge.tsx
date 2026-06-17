import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { useLibraryIqSettings } from "../hooks/useLibraryIqSettings";
import { fetchRating } from "../services/ratings";
import { getInternalRating } from "../services/steamAppStore";
import type {
  BadgePosition,
  LibraryIqSettings,
  SteamRatingResponse
} from "../types";

function getFallbackDisplayRating(
  appid: string,
  settings: LibraryIqSettings
): SteamRatingResponse | null {
  if (settings.ratingSource === "api") {
    return getInternalRating(appid, {
      ...settings,
      ratingSource: "filtered"
    });
  }

  return getInternalRating(appid, settings);
}

function hasDisplayableRating(rating: SteamRatingResponse | null): boolean {
  return Boolean(
    rating &&
      rating.ok &&
      typeof rating.positive_percent === "number" &&
      Number.isFinite(rating.positive_percent)
  );
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

function getToneColour(
  rating: SteamRatingResponse,
  settings: LibraryIqSettings
) {
  if (settings.colourMode === "neutral" || settings.badgePillStyle === "steam") {
    return {
      background: "rgba(72, 86, 103, 0.58)",
      border: "rgba(166, 185, 205, 0.32)",
      color: "rgba(236, 242, 248, 0.98)",
      solid: "rgba(67, 92, 121, 0.95)"
    };
  }

  const tone = getRatingTone(rating.positive_percent ?? 0);

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

function getLabel(rating: SteamRatingResponse, settings: LibraryIqSettings) {
  const percentage = rating.positive_percent ?? 0;

  if (settings.badgeDisplayMode === "compact") {
    return String(percentage);
  }

  if (settings.badgeDisplayMode === "label") {
    const desc = rating.review_score_desc ?? "";

    if (desc.includes("Overwhelmingly Positive")) {
      return "O+";
    }

    if (desc.includes("Very Positive")) {
      return "V+";
    }

    if (desc.includes("Mostly Positive")) {
      return "M+";
    }

    if (desc.includes("Positive")) {
      return "P+";
    }

    if (desc.includes("Mixed")) {
      return "Mix";
    }

    if (desc.includes("Mostly Negative")) {
      return "M-";
    }

    if (desc.includes("Very Negative")) {
      return "V-";
    }

    if (desc.includes("Negative")) {
      return "N-";
    }

    return `${percentage}%`;
  }

  return `${percentage}%`;
}

function getBadgeWidth(settings: LibraryIqSettings) {
  if (settings.badgeDisplayMode === "compact") {
    return "32px";
  }

  if (settings.badgeDisplayMode === "label") {
    return "34px";
  }

  return "40px";
}

function getBadgeVisualStyle(
  rating: SteamRatingResponse,
  settings: LibraryIqSettings
): React.CSSProperties {
  const colours = getToneColour(rating, settings);

  const base: React.CSSProperties = {
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

function getClickUrl(appid: string, settings: LibraryIqSettings): string | null {
  if (settings.badgeClickAction === "none") {
    return null;
  }

  if (settings.badgeClickAction === "store") {
    return `https://store.steampowered.com/app/${appid}/`;
  }

  return `https://store.steampowered.com/app/${appid}/#app_reviews_hash`;
}

export function SteamSidebarRatingBadge({
  appid,
  slot
}: {
  appid: string;
  slot: BadgePosition;
}) {
  const [settings] = useLibraryIqSettings();
  const [isHovered, setIsHovered] = useState(false);

  const [rating, setRating] = useState<SteamRatingResponse | null>(() =>
    getFallbackDisplayRating(appid, settings)
  );

  useEffect(() => {
    let cancelled = false;

    if (!settings.showRatings) {
      setRating(null);
      return () => {
        cancelled = true;
      };
    }

    setRating(getFallbackDisplayRating(appid, settings));

    fetchRating(appid, settings).then((nextRating) => {
      if (!cancelled) {
        setRating(nextRating);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [appid, settings.showRatings, settings.ratingSource]);

  if (!settings.showRatings || settings.badgePosition !== slot) {
    return null;
  }

  const badgeWidth = getBadgeWidth(settings);

  if (!hasDisplayableRating(rating)) {
    if (slot === "betweenIconAndTitle") {
      return (
        <span
          className="library-iq-rating-badge"
          style={{
            display: "inline-flex",
            width: badgeWidth,
            minWidth: badgeWidth,
            maxWidth: badgeWidth,
            height: "16px",
            opacity: 0,
            pointerEvents: "none"
          }}
        />
      );
    }

    return null;
  }

  const displayRating = rating as SteamRatingResponse;
  const clickUrl = getClickUrl(appid, settings);
  const visualStyle = getBadgeVisualStyle(displayRating, settings);

  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    if (!clickUrl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    window.open(clickUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <span
      className="library-iq-rating-badge"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        width: badgeWidth,
        minWidth: badgeWidth,
        maxWidth: badgeWidth,
        height: "16px",
        padding: "0 5px",
        borderRadius:
          settings.badgeShape === "pill"
            ? "999px"
            : settings.badgeShape === "squircle"
              ? "9px"
              : settings.badgeShape === "rounded"
                ? "5px"
                : "2px",
        boxSizing: "border-box",

        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "10px",
        fontWeight: 850,
        lineHeight: "16px",
        letterSpacing: "0px",
        whiteSpace: "nowrap",
        textAlign: "center",
        userSelect: "none",
        pointerEvents: "auto",
        cursor: clickUrl ? "pointer" : "default",
        transform: isHovered && clickUrl ? "translateY(-1px)" : "none",

        ...visualStyle
      }}
      title={
        settings.showTooltip
          ? `${displayRating.review_score_desc ?? "Steam rating"} · ${
              displayRating.positive_percent
            }% positive · ${displayRating.source ?? "Steam"}${
              clickUrl ? " · Click to open" : ""
            }`
          : undefined
      }
    >
      {getLabel(displayRating, settings)}
    </span>
  );
}
