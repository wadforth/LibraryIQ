export type WebpackRequire = ((id: number | string) => unknown) & {
  m?: Record<string, unknown>;
  c?: Record<string, unknown>;
};

export type JsxFn = (type: unknown, props: unknown, key?: unknown) => unknown;

export type RatingSource = "filtered" | "unfiltered" | "api";

export type ColourMode = "coloured" | "neutral";

export type BadgePosition = "betweenIconAndTitle" | "afterTitle";

export type RatingSortMode = "off" | "highestFirst" | "lowestFirst";

export type BadgeClickAction = "none" | "reviews" | "store";

export type BadgeDisplayMode = "percentage" | "compact" | "label";

export type BadgePillStyle = "glass" | "solid" | "outline" | "steam";

export type BadgeShape = "pill" | "squircle" | "rounded" | "square";

export type LibraryIqSettings = {
  showRatings: boolean;
  ratingSource: RatingSource;
  colourMode: ColourMode;
  showTooltip: boolean;
  badgePosition: BadgePosition;
  minimumRating: number | null;
  ratingSortMode: RatingSortMode;

  showQuickFilterBar: boolean;
  quickFilterCollapsedLeft: number;
  quickFilterCollapsedTop: number;
  quickFilterPanelLeft: number;
  quickFilterPanelTop: number;

  badgeClickAction: BadgeClickAction;
  badgeDisplayMode: BadgeDisplayMode;
  badgePillStyle: BadgePillStyle;
  badgeShape: BadgeShape;
};

export type SteamRatingResponse = {
  ok: boolean;
  appid?: string;
  review_score?: number;
  review_score_desc?: string;
  total_positive?: number;
  total_negative?: number;
  total_reviews?: number;
  positive_percent?: number | null;
  updated_at?: number;
  source?: string;
  error?: string;
  detail?: string;
};