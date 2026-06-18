import { useEffect, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
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

type BadgeStyle = CSSProperties & {
  "--library-iq-badge-width"?: string;
  "--library-iq-badge-color"?: string;
  "--library-iq-badge-background"?: string;
  "--library-iq-badge-border"?: string;
  "--library-iq-badge-shadow"?: string;
  "--library-iq-badge-left-spacing"?: string;
  "--library-iq-badge-right-spacing"?: string;
};

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

  const effectiveBadgePosition = settings.compatibilityMode
    ? "afterTitle"
    : settings.badgePosition;

  if (!settings.showRatings || effectiveBadgePosition !== slot) {
    return null;
  }

  const badgeWidth = getBadgeWidth(settings.badgeDisplayMode);

  if (!hasDisplayableRating(rating)) {
    if (slot === "beforeIcon" || slot === "betweenIconAndTitle") {
      return (
        <div
          className={`library-iq-rating-badge library-iq-rating-badge-${slot}`}
          style={
            {
            display: "inline-flex",
            width: badgeWidth,
            minWidth: badgeWidth,
            maxWidth: badgeWidth,
            height: "16px",
            "--library-iq-badge-left-spacing": "0px",
            "--library-iq-badge-right-spacing":
              slot === "beforeIcon" || slot === "betweenIconAndTitle"
                ? `${settings.badgeTitleSpacing}px`
                : "0px",
            marginRight:
              slot === "beforeIcon" || slot === "betweenIconAndTitle"
                ? `${settings.badgeTitleSpacing}px`
                : 0,
            opacity: 0,
            pointerEvents: "none"
            } as BadgeStyle
          }
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
  const badgeColor =
    typeof visualStyle.color === "string"
      ? visualStyle.color
      : "rgba(236, 242, 248, 0.98)";
  const badgeBackground =
    typeof visualStyle.background === "string"
      ? visualStyle.background
      : "rgba(72, 86, 103, 0.58)";
  const badgeBorder =
    typeof visualStyle.border === "string"
      ? visualStyle.border
      : "1px solid rgba(166, 185, 205, 0.32)";
  const badgeShadow =
    typeof visualStyle.boxShadow === "string" ? visualStyle.boxShadow : "none";

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if (!clickUrl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    window.open(clickUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={`library-iq-rating-badge library-iq-rating-badge-${slot}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={
        {
        "--library-iq-badge-width": badgeWidth,
        "--library-iq-badge-color": badgeColor,
        "--library-iq-badge-background": badgeBackground,
        "--library-iq-badge-border": badgeBorder,
        "--library-iq-badge-shadow": badgeShadow,
        "--library-iq-badge-left-spacing":
          slot === "afterTitle" ? `${settings.badgeTitleSpacing}px` : "0px",
        "--library-iq-badge-right-spacing":
          slot === "beforeIcon" || slot === "betweenIconAndTitle"
            ? `${settings.badgeTitleSpacing}px`
            : "0px",
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
        marginLeft:
          slot === "afterTitle" ? `${settings.badgeTitleSpacing}px` : 0,
        marginRight:
          slot === "beforeIcon" || slot === "betweenIconAndTitle"
            ? `${settings.badgeTitleSpacing}px`
            : 0,
        cursor: clickUrl ? "pointer" : "default",
        transform: isHovered && clickUrl ? "translateY(-1px)" : "none",

        ...visualStyle
        } as BadgeStyle
      }
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
    </div>
  );
}
