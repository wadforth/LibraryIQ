import type { CSSProperties } from "react";
import {
  DEFAULT_SETTINGS,
  useLibraryIqSettings
} from "../hooks/useLibraryIqSettings";
import type {
  BadgeClickAction,
  BadgeDisplayMode,
  BadgePillStyle,
  BadgePosition,
  BadgeShape,
  ColourMode,
  LibraryIqSettings,
  RatingSource,
  RatingSortMode
} from "../types";
import { SettingRow } from "./SettingRow";

const cardStyle: CSSProperties = {
  borderRadius: "14px",
  background:
    "linear-gradient(180deg, rgba(25,35,48,0.94), rgba(17,25,36,0.94))",
  border: "1px solid rgba(255,255,255,0.085)",
  boxShadow: "0 10px 28px rgba(0,0,0,0.22)"
};

function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: "48px",
        height: "26px",
        padding: "3px",
        borderRadius: "999px",
        border: checked
          ? "1px solid rgba(112,190,132,0.52)"
          : "1px solid rgba(180,195,215,0.22)",
        background: checked
          ? "rgba(54,118,76,0.62)"
          : "rgba(70,82,98,0.52)",
        cursor: "pointer",
        boxSizing: "border-box"
      }}
    >
      <span
        style={{
          display: "block",
          width: "18px",
          height: "18px",
          borderRadius: "999px",
          background: "rgba(245,248,252,0.96)",
          transform: checked ? "translateX(20px)" : "translateX(0)",
          transition: "transform 140ms ease",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)"
        }}
      />
    </button>
  );
}

function SelectBox<T extends string>({
  value,
  options,
  onChange
}: {
  value: T;
  options: Array<{
    value: T;
    label: string;
  }>;
  onChange: (value: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.currentTarget.value as T)}
      style={{
        width: "100%",
        minWidth: 0,
        padding: "9px 10px",
        borderRadius: "10px",
        background: "rgba(7,13,22,0.42)",
        color: "rgba(245,248,252,0.94)",
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: "12px",
        fontWeight: 750,
        outline: "none"
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function SliderControl({
  value,
  min,
  max,
  step = 1,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  function updateValue(nextValue: number) {
    if (!Number.isFinite(nextValue)) {
      return;
    }

    onChange(Math.min(max, Math.max(min, Math.round(nextValue))));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => updateValue(Number(event.currentTarget.value))}
        style={{ width: "100%" }}
      />

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => updateValue(Number(event.currentTarget.value))}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: "10px",
          background: "rgba(7,13,22,0.42)",
          color: "rgba(245,248,252,0.94)",
          border: "1px solid rgba(255,255,255,0.12)",
          fontSize: "12px",
          fontWeight: 750,
          outline: "none",
          boxSizing: "border-box"
        }}
      />
    </div>
  );
}

function getPreviewLabel(displayMode: BadgeDisplayMode) {
  if (displayMode === "compact") {
    return "82";
  }

  if (displayMode === "label") {
    return "V+";
  }

  return "82%";
}

function getPreviewWidth(displayMode: BadgeDisplayMode) {
  if (displayMode === "compact") {
    return "32px";
  }

  if (displayMode === "label") {
    return "34px";
  }

  return "40px";
}

function getPreviewBorderRadius(badgeShape: BadgeShape) {
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

function getPreviewColours(colourMode: ColourMode, pillStyle: BadgePillStyle) {
  if (colourMode === "neutral" || pillStyle === "steam") {
    return {
      background: "rgba(72, 86, 103, 0.58)",
      border: "rgba(166, 185, 205, 0.32)",
      color: "rgba(236, 242, 248, 0.98)",
      solid: "rgba(67, 92, 121, 0.95)"
    };
  }

  return {
    background: "rgba(50, 116, 73, 0.62)",
    border: "rgba(121, 207, 145, 0.42)",
    color: "rgba(232, 255, 237, 0.98)",
    solid: "rgba(46, 132, 74, 0.96)"
  };
}

function getPreviewBadgeStyle({
  colourMode,
  displayMode,
  pillStyle,
  badgeShape
}: {
  colourMode: ColourMode;
  displayMode: BadgeDisplayMode;
  pillStyle: BadgePillStyle;
  badgeShape: BadgeShape;
}): CSSProperties {
  const colours = getPreviewColours(colourMode, pillStyle);
  const width = getPreviewWidth(displayMode);

  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width,
    minWidth: width,
    height: "16px",
    padding: "0 5px",
    borderRadius: getPreviewBorderRadius(badgeShape),
    boxSizing: "border-box",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "10px",
    fontWeight: 850,
    lineHeight: "16px",
    color: colours.color,
    border: `1px solid ${colours.border}`,
    background: colours.background,
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 2px rgba(0,0,0,0.24)"
  };

  if (pillStyle === "solid") {
    return {
      ...base,
      background: colours.solid,
      border: "1px solid rgba(255,255,255,0.12)",
      boxShadow: "0 1px 2px rgba(0,0,0,0.28)"
    };
  }

  if (pillStyle === "outline") {
    return {
      ...base,
      background: "rgba(0,0,0,0.12)",
      border: `1px solid ${colours.border}`,
      boxShadow: "none"
    };
  }

  if (pillStyle === "steam") {
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

function BadgePreview({
  colourMode,
  badgePosition,
  displayMode,
  pillStyle,
  badgeShape
}: {
  colourMode: ColourMode;
  badgePosition: BadgePosition;
  displayMode: BadgeDisplayMode;
  pillStyle: BadgePillStyle;
  badgeShape: BadgeShape;
}) {
  const badge = (
    <span
      style={getPreviewBadgeStyle({
        colourMode,
        displayMode,
        pillStyle,
        badgeShape
      })}
    >
      {getPreviewLabel(displayMode)}
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "12px",
        borderRadius: "12px",
        background: "rgba(7,13,22,0.32)",
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: "24px",
          minWidth: "24px",
          height: "24px",
          borderRadius: "5px",
          background:
            "linear-gradient(135deg, rgba(82,125,170,0.9), rgba(30,45,64,0.9))",
          border: "1px solid rgba(255,255,255,0.12)"
        }}
      />

      {badgePosition === "betweenIconAndTitle" ? badge : null}

      <div
        style={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: "rgba(225,234,246,0.88)",
          fontSize: "13px",
          fontWeight: 650
        }}
      >
        Example Game
      </div>

      {badgePosition === "afterTitle" ? badge : null}
    </div>
  );
}

function StatusPill({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "12px",
        background: "rgba(7,13,22,0.32)",
        border: "1px solid rgba(255,255,255,0.07)"
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: "rgba(205,218,233,0.56)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          fontWeight: 750
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: "3px",
          fontSize: "13px",
          color: "rgba(245,248,252,0.95)",
          fontWeight: 850
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function LibraryIqSettingsPanel() {
  const [settings, setSettings] = useLibraryIqSettings();

  function updateSetting<K extends keyof LibraryIqSettings>(
    key: K,
    value: LibraryIqSettings[K]
  ) {
    setSettings({
      ...settings,
      [key]: value
    });
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
  }

  function resetQuickFilterPosition() {
    setSettings({
      ...settings,
      quickFilterCollapsedLeft: DEFAULT_SETTINGS.quickFilterCollapsedLeft,
      quickFilterCollapsedTop: DEFAULT_SETTINGS.quickFilterCollapsedTop,
      quickFilterPanelLeft: DEFAULT_SETTINGS.quickFilterPanelLeft,
      quickFilterPanelTop: DEFAULT_SETTINGS.quickFilterPanelTop
    });
  }

  const sourceLabel =
    settings.ratingSource === "filtered"
      ? "Filtered"
      : settings.ratingSource === "unfiltered"
        ? "Unfiltered"
        : "API preferred";

  const badgePositionLabel =
    settings.badgePosition === "betweenIconAndTitle"
      ? "Before title"
      : "After title";

  const minimumRatingLabel =
    settings.minimumRating === null ? "Off" : `${settings.minimumRating}%+`;

  const sortLabel =
    settings.ratingSortMode === "highestFirst"
      ? "Highest first"
      : settings.ratingSortMode === "lowestFirst"
        ? "Lowest first"
        : "Off";

  const badgeActionLabel =
    settings.badgeClickAction === "reviews"
      ? "Reviews"
      : settings.badgeClickAction === "store"
        ? "Store page"
        : "None";

  const badgeModeLabel =
    settings.badgeDisplayMode === "percentage"
      ? "Percentage"
      : settings.badgeDisplayMode === "compact"
        ? "Compact"
        : "Short label";

  const badgeShapeLabel =
    settings.badgeShape === "pill"
      ? "Pill"
      : settings.badgeShape === "squircle"
        ? "Squircle"
        : settings.badgeShape === "rounded"
          ? "Rounded"
          : "Square";

  return (
    <div
      style={{
        padding: "18px",
        width: "100%",
        maxWidth: "390px",
        color: "#dbe5f2",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box"
      }}
    >
      <div
        style={{
          ...cardStyle,
          padding: "16px",
          marginBottom: "14px",
          background:
            "linear-gradient(135deg, rgba(38,57,78,0.92), rgba(19,28,40,0.94))"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "11px",
            marginBottom: "14px"
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              minWidth: "34px",
              height: "34px",
              borderRadius: "10px",
              background:
                "linear-gradient(135deg, rgba(89,140,206,0.92), rgba(55,95,150,0.72))",
              color: "white",
              fontSize: "17px",
              fontWeight: 900,
              boxShadow: "0 6px 18px rgba(0,0,0,0.25)"
            }}
          >
            ★
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "22px",
                lineHeight: 1.1,
                fontWeight: 900,
                color: "#ffffff",
                letterSpacing: "-0.3px"
              }}
            >
              LibraryIQ
            </div>

            <div
              style={{
                marginTop: "4px",
                fontSize: "12px",
                lineHeight: 1.35,
                color: "rgba(220,230,242,0.74)"
              }}
            >
              Steam Library ratings, quick filters and review sorting.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "8px",
            marginBottom: "12px"
          }}
        >
          <StatusPill
            label="Sidebar"
            value={settings.showRatings ? "Enabled" : "Disabled"}
          />
          <StatusPill
            label="Quick filter"
            value={settings.showQuickFilterBar ? "Visible" : "Hidden"}
          />
          <StatusPill label="Source" value={sourceLabel} />
          <StatusPill label="Position" value={badgePositionLabel} />
          <StatusPill label="Minimum" value={minimumRatingLabel} />
          <StatusPill label="Sort" value={sortLabel} />
          <StatusPill label="Badge click" value={badgeActionLabel} />
          <StatusPill label="Badge mode" value={badgeModeLabel} />
          <StatusPill label="Badge shape" value={badgeShapeLabel} />
        </div>

        <BadgePreview
          colourMode={settings.colourMode}
          badgePosition={settings.badgePosition}
          displayMode={settings.badgeDisplayMode}
          pillStyle={settings.badgePillStyle}
          badgeShape={settings.badgeShape}
        />

        <button
          type="button"
          onClick={resetSettings}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "9px 10px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.055)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(232,240,248,0.9)",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          Reset to defaults
        </button>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: "16px",
          marginBottom: "14px"
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.1px"
          }}
        >
          Display
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "rgba(220,230,242,0.64)"
          }}
        >
          Controls how ratings and quick controls appear in the Steam Library.
        </div>

        <SettingRow
          title="Show sidebar ratings"
          description="Displays the percentage badge in the Library game list."
        >
          <ToggleSwitch
            checked={settings.showRatings}
            onChange={(checked) => updateSetting("showRatings", checked)}
          />
        </SettingRow>

        <SettingRow
          title="Show quick filter bar"
          description="Shows a compact LibraryIQ filter bar over the Steam Library for fast rating filters and sorting."
        >
          <ToggleSwitch
            checked={settings.showQuickFilterBar}
            onChange={(checked) => updateSetting("showQuickFilterBar", checked)}
          />
        </SettingRow>

        <SettingRow
          title="Badge position"
          description="Choose whether the badge appears between the icon and title, or after the title."
        >
          <SelectBox<BadgePosition>
            value={settings.badgePosition}
            onChange={(value) => updateSetting("badgePosition", value)}
            options={[
              {
                value: "betweenIconAndTitle",
                label: "Between icon and title"
              },
              {
                value: "afterTitle",
                label: "After title"
              }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Colour mode"
          description="Coloured badges show rating quality. Neutral uses one consistent badge colour."
        >
          <SelectBox<ColourMode>
            value={settings.colourMode}
            onChange={(value) => updateSetting("colourMode", value)}
            options={[
              { value: "coloured", label: "Coloured" },
              { value: "neutral", label: "Neutral" }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Show tooltip"
          description="Shows the review label, percentage and source on hover."
        >
          <ToggleSwitch
            checked={settings.showTooltip}
            onChange={(checked) => updateSetting("showTooltip", checked)}
          />
        </SettingRow>

        <SettingRow
          title="Badge click action"
          description="Choose what happens when clicking a review percentage badge."
        >
          <SelectBox<BadgeClickAction>
            value={settings.badgeClickAction}
            onChange={(value) => updateSetting("badgeClickAction", value)}
            options={[
              { value: "none", label: "None" },
              { value: "reviews", label: "Open reviews" },
              { value: "store", label: "Open store page" }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Badge display mode"
          description="Choose whether the badge shows the full percentage, compact number, or a short review label."
        >
          <SelectBox<BadgeDisplayMode>
            value={settings.badgeDisplayMode}
            onChange={(value) => updateSetting("badgeDisplayMode", value)}
            options={[
              { value: "percentage", label: "Percentage" },
              { value: "compact", label: "Compact" },
              { value: "label", label: "Short label" }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Pill design"
          description="Changes the visual style of the sidebar rating badge."
        >
          <SelectBox<BadgePillStyle>
            value={settings.badgePillStyle}
            onChange={(value) => updateSetting("badgePillStyle", value)}
            options={[
              { value: "glass", label: "Glass" },
              { value: "solid", label: "Solid" },
              { value: "outline", label: "Outline" },
              { value: "steam", label: "Steam neutral" }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Badge shape"
          description="Changes the badge geometry without changing the colour style."
        >
          <SelectBox<BadgeShape>
            value={settings.badgeShape}
            onChange={(value) => updateSetting("badgeShape", value)}
            options={[
              { value: "pill", label: "Pill" },
              { value: "squircle", label: "Squircle" },
              { value: "rounded", label: "Rounded rectangle" },
              { value: "square", label: "Square" }
            ]}
          />
        </SettingRow>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: "16px",
          marginBottom: "14px"
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.1px"
          }}
        >
          Quick filter position
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "rgba(220,230,242,0.64)"
          }}
        >
          Adjusts the quick filter position in real time. Values are measured in
          pixels from the top-left of the Steam window.
        </div>

        <SettingRow
          title="Collapsed X position"
          description="Horizontal position of the small IQ button."
        >
          <SliderControl
            value={settings.quickFilterCollapsedLeft}
            min={0}
            max={600}
            onChange={(value) => updateSetting("quickFilterCollapsedLeft", value)}
          />
        </SettingRow>

        <SettingRow
          title="Collapsed Y position"
          description="Vertical position of the small IQ button."
        >
          <SliderControl
            value={settings.quickFilterCollapsedTop}
            min={40}
            max={500}
            onChange={(value) => updateSetting("quickFilterCollapsedTop", value)}
          />
        </SettingRow>

        <SettingRow
          title="Expanded X position"
          description="Horizontal position of the opened quick filter panel."
        >
          <SliderControl
            value={settings.quickFilterPanelLeft}
            min={0}
            max={600}
            onChange={(value) => updateSetting("quickFilterPanelLeft", value)}
          />
        </SettingRow>

        <SettingRow
          title="Expanded Y position"
          description="Vertical position of the opened quick filter panel."
        >
          <SliderControl
            value={settings.quickFilterPanelTop}
            min={40}
            max={500}
            onChange={(value) => updateSetting("quickFilterPanelTop", value)}
          />
        </SettingRow>

        <button
          type="button"
          onClick={resetQuickFilterPosition}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "9px 10px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.055)",
            border: "1px solid rgba(255,255,255,0.10)",
            color: "rgba(232,240,248,0.9)",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          Reset quick filter position
        </button>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: "16px",
          marginBottom: "14px"
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.1px"
          }}
        >
          Rating source and filters
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "rgba(220,230,242,0.64)"
          }}
        >
          Choose which Steam review percentage LibraryIQ should prefer and how
          the Library list should be filtered.
        </div>

        <SettingRow
          title="Source preference"
          description="Filtered usually best matches Steam’s review-bomb-adjusted score."
        >
          <SelectBox<RatingSource>
            value={settings.ratingSource}
            onChange={(value) => updateSetting("ratingSource", value)}
            options={[
              { value: "filtered", label: "Filtered" },
              { value: "unfiltered", label: "Unfiltered" },
              { value: "api", label: "API preferred" }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Minimum rating"
          description="Only show games at or above this Steam review percentage. Off shows all games."
        >
          <SelectBox<string>
            value={
              settings.minimumRating === null
                ? "off"
                : String(settings.minimumRating)
            }
            onChange={(value) =>
              updateSetting(
                "minimumRating",
                value === "off" ? null : Number(value)
              )
            }
            options={[
              { value: "off", label: "Off" },
              { value: "50", label: "50%+" },
              { value: "60", label: "60%+" },
              { value: "70", label: "70%+" },
              { value: "80", label: "80%+" },
              { value: "90", label: "90%+" }
            ]}
          />
        </SettingRow>

        <SettingRow
          title="Sort by rating"
          description="Sort the visible Library list by Steam review percentage."
        >
          <SelectBox<RatingSortMode>
            value={settings.ratingSortMode}
            onChange={(value) => updateSetting("ratingSortMode", value)}
            options={[
              { value: "off", label: "Off" },
              { value: "highestFirst", label: "Highest first" },
              { value: "lowestFirst", label: "Lowest first" }
            ]}
          />
        </SettingRow>

        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "10px",
            background: "rgba(74, 103, 137, 0.14)",
            border: "1px solid rgba(118, 168, 220, 0.13)",
            color: "rgba(222,233,246,0.76)",
            fontSize: "12px",
            lineHeight: 1.5
          }}
        >
          Filtered and unfiltered often look identical. They only differ where
          Steam has separate review-bomb-filtered data for that game. Sorting
          works in flat and grouped Library views, with grouped mode sorting
          games inside each visible collection.
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: "16px"
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.1px"
          }}
        >
          How the percentage is calculated
        </div>

        <div
          style={{
            marginTop: "11px",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "rgba(220,230,242,0.74)"
          }}
        >
          <p style={{ marginTop: 0 }}>
            The badge shows the game’s positive review percentage, rounded to
            the nearest whole number.
          </p>

          <div
            style={{
              margin: "12px 0",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.045)",
              border: "1px solid rgba(255,255,255,0.07)"
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 850,
                marginBottom: "5px"
              }}
            >
              Filtered
            </div>
            Uses Steam’s internal{" "}
            <code>review_percentage_without_bombs</code> where available.
          </div>

          <div
            style={{
              margin: "12px 0",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.045)",
              border: "1px solid rgba(255,255,255,0.07)"
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 850,
                marginBottom: "5px"
              }}
            >
              Unfiltered
            </div>
            Uses Steam’s internal <code>review_percentage_with_bombs</code>{" "}
            where available.
          </div>

          <div
            style={{
              margin: "12px 0",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.045)",
              border: "1px solid rgba(255,255,255,0.07)"
            }}
          >
            <div
              style={{
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 850,
                marginBottom: "5px"
              }}
            >
              API preferred
            </div>
            Uses Steam review totals when available, then falls back to internal
            data.
          </div>

          <div
            style={{
              marginTop: "12px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(7,13,22,0.34)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "Consolas, monospace",
              color: "rgba(255,255,255,0.92)",
              fontSize: "12px"
            }}
          >
            positive reviews ÷ total reviews × 100
          </div>

          <p style={{ marginBottom: 0 }}>
            Non-Steam games and entries without review data are hidden rather
            than showing a placeholder.
          </p>
        </div>
      </div>
    </div>
  );
}