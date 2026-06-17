import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { useLibraryIqSettings } from "../hooks/useLibraryIqSettings";
import { fetchRating } from "../services/ratings";
import { getInternalRating } from "../services/steamAppStore";
import {
  getBadgeBorderRadius,
  getBadgeVisualStyle,
  getBadgeWidth
} from "../styles/badgeVisuals";
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

  const badgeWidth = getBadgeWidth(settings.badgeDisplayMode);

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
  const visualStyle = getBadgeVisualStyle(
    displayRating.positive_percent ?? 0,
    settings
  );

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
        borderRadius: getBadgeBorderRadius(settings.badgeShape),
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
