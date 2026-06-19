import {
  ButtonItem,
  DropdownItem,
  Field,
  SliderField,
  ToggleField
} from "@steambrew/client";
import { useEffect, useState } from "react";
import {
  BADGE_TITLE_SPACING_LIMITS,
  DEFAULT_SETTINGS,
  QUICK_FILTER_POSITION_LIMITS,
  useLibraryIqSettings
} from "../hooks/useLibraryIqSettings";
import {
  addThemeCompatibilityListener,
  ensureThemeCompatibilityLoaded,
  isMinimalDarkActive
} from "../services/themeCompatibility";
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

type Option<T extends string> = {
  data: T;
  label: string;
};

function options<T extends string>(
  values: Array<{ value: T; label: string }>
): Array<Option<T>> {
  return values.map((value) => ({
    data: value.value,
    label: value.label
  }));
}

function SectionHeader({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <Field
      label={title}
      description={description}
      focusable={false}
      bottomSeparator="none"
    />
  );
}

function NativeDropdown<T extends string>({
  label,
  description,
  value,
  dropdownOptions,
  disabled,
  onChange
}: {
  label: string;
  description: string;
  value: T;
  dropdownOptions: Array<Option<T>>;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <DropdownItem
      label={label}
      description={description}
      rgOptions={dropdownOptions}
      selectedOption={value}
      disabled={disabled}
      onChange={(option) => onChange(option.data as T)}
    />
  );
}

const badgePositionOptions = options<BadgePosition>([
  { value: "beforeIcon", label: "Before icon" },
  { value: "betweenIconAndTitle", label: "Between icon and title" },
  { value: "afterTitle", label: "After title" }
]);

const colourModeOptions = options<ColourMode>([
  { value: "coloured", label: "Coloured" },
  { value: "neutral", label: "Neutral" }
]);

const badgeClickActionOptions = options<BadgeClickAction>([
  { value: "none", label: "None" },
  { value: "reviews", label: "Open reviews" },
  { value: "store", label: "Open store page" }
]);

const badgeDisplayModeOptions = options<BadgeDisplayMode>([
  { value: "percentage", label: "Percentage" },
  { value: "compact", label: "Compact number" },
  { value: "label", label: "Short label" }
]);

const badgePillStyleOptions = options<BadgePillStyle>([
  { value: "glass", label: "Glass" },
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" },
  { value: "steam", label: "Steam neutral" }
]);

const badgeShapeOptions = options<BadgeShape>([
  { value: "pill", label: "Pill" },
  { value: "squircle", label: "Squircle" },
  { value: "rounded", label: "Rounded rectangle" },
  { value: "square", label: "Square" }
]);

const ratingSourceOptions = options<RatingSource>([
  { value: "filtered", label: "Filtered" },
  { value: "unfiltered", label: "Unfiltered" },
  { value: "api", label: "Public API preferred" }
]);

const minimumRatingOptions = options<string>([
  { value: "off", label: "Off" },
  { value: "50", label: "50%+" },
  { value: "60", label: "60%+" },
  { value: "70", label: "70%+" },
  { value: "80", label: "80%+" },
  { value: "90", label: "90%+" }
]);

const ratingSortOptions = options<RatingSortMode>([
  { value: "off", label: "Off" },
  { value: "highestFirst", label: "Highest first" },
  { value: "lowestFirst", label: "Lowest first" }
]);

export function LibraryIqSettingsPanel() {
  const [settings, setSettings] = useLibraryIqSettings();
  const [, setThemeCompatibilityVersion] = useState(0);
  const listMutationDisabled = settings.compatibilityMode;
  const minimalDarkActive = isMinimalDarkActive();
  const availableBadgePositionOptions = minimalDarkActive
    ? badgePositionOptions.filter((option) => option.data !== "afterTitle")
    : badgePositionOptions;
  const selectedBadgePosition =
    minimalDarkActive && settings.badgePosition === "afterTitle"
      ? "betweenIconAndTitle"
      : settings.badgePosition;

  useEffect(() => {
    ensureThemeCompatibilityLoaded();

    return addThemeCompatibilityListener(() => {
      setThemeCompatibilityVersion((version) => version + 1);
    });
  }, []);

  function updateSetting<K extends keyof LibraryIqSettings>(
    key: K,
    value: LibraryIqSettings[K]
  ) {
    setSettings({
      ...settings,
      [key]: value
    });
  }

  function toggleSetting<K extends keyof LibraryIqSettings>(key: K) {
    const currentValue = settings[key];

    if (typeof currentValue !== "boolean") {
      return;
    }

    updateSetting(key, !currentValue as LibraryIqSettings[K]);
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

  function updateMinimumRating(value: string) {
    if (listMutationDisabled && value !== "off") {
      return;
    }

    updateSetting("minimumRating", value === "off" ? null : Number(value));
  }

  function updateRatingSortMode(value: RatingSortMode) {
    if (listMutationDisabled && value !== "off") {
      return;
    }

    updateSetting("ratingSortMode", value);
  }

  return (
    <>
      <SectionHeader
        title="LibraryIQ"
        description="Steam Library sidebar ratings, Library list filtering, and review sorting. This is for the Library list, not Steam Grid View."
      />

      <ToggleField
        label="Show sidebar ratings"
        description="Displays Steam review percentage badges in the Library game list."
        checked={settings.showRatings}
        onChange={() => toggleSetting("showRatings")}
      />

      <ToggleField
        label="Theme compatibility mode"
        description="Uses safer after-title badges and disables LibraryIQ list sorting/filtering for heavily themed Steam clients."
        checked={settings.compatibilityMode}
        onChange={() => toggleSetting("compatibilityMode")}
      />

      <ToggleField
        label="Show quick filter bar"
        description="Shows the compact LibraryIQ quick filter in the Steam Library."
        checked={settings.showQuickFilterBar}
        disabled={minimalDarkActive}
        onChange={() => toggleSetting("showQuickFilterBar")}
      />

      <SectionHeader title="Badge" />

      <NativeDropdown<BadgePosition>
        label="Badge position"
        description={
          minimalDarkActive
            ? "After title is disabled for Minimal Dark because that theme rewrites title rows."
            : "Choose where the review badge appears in each Library row."
        }
        value={selectedBadgePosition}
        dropdownOptions={availableBadgePositionOptions}
        disabled={settings.compatibilityMode}
        onChange={(value) => updateSetting("badgePosition", value)}
      />

      <SliderField
        label="Badge/title spacing"
        description="Controls the gap between the rating badge and game title."
        value={settings.badgeTitleSpacing}
        min={BADGE_TITLE_SPACING_LIMITS.min}
        max={BADGE_TITLE_SPACING_LIMITS.max}
        step={1}
        showValue
        editableValue
        valueSuffix="px"
        onChange={(value) => updateSetting("badgeTitleSpacing", value)}
      />

      <NativeDropdown<ColourMode>
        label="Colour mode"
        description="Coloured badges reflect rating quality; neutral uses one consistent colour."
        value={settings.colourMode}
        dropdownOptions={colourModeOptions}
        onChange={(value) => updateSetting("colourMode", value)}
      />

      <ToggleField
        label="Show tooltip"
        description="Shows the review label, percentage, and source when hovering a badge."
        checked={settings.showTooltip}
        onChange={() => toggleSetting("showTooltip")}
      />

      <NativeDropdown<BadgeClickAction>
        label="Badge click action"
        description="Choose what happens when clicking a review percentage badge."
        value={settings.badgeClickAction}
        dropdownOptions={badgeClickActionOptions}
        onChange={(value) => updateSetting("badgeClickAction", value)}
      />

      <NativeDropdown<BadgeDisplayMode>
        label="Badge display mode"
        description="Choose whether badges show a percentage, compact number, or short review label."
        value={settings.badgeDisplayMode}
        dropdownOptions={badgeDisplayModeOptions}
        onChange={(value) => updateSetting("badgeDisplayMode", value)}
      />

      <NativeDropdown<BadgePillStyle>
        label="Badge style"
        description="Changes the visual treatment of the sidebar rating badge."
        value={settings.badgePillStyle}
        dropdownOptions={badgePillStyleOptions}
        onChange={(value) => updateSetting("badgePillStyle", value)}
      />

      <NativeDropdown<BadgeShape>
        label="Badge shape"
        description="Changes the badge geometry without changing the colour mode."
        value={settings.badgeShape}
        dropdownOptions={badgeShapeOptions}
        onChange={(value) => updateSetting("badgeShape", value)}
      />

      <SectionHeader title="Ratings" />

      <NativeDropdown<RatingSource>
        label="Source preference"
        description="Public API preferred uses Steam's public app reviews endpoint and does not need a user API key."
        value={settings.ratingSource}
        dropdownOptions={ratingSourceOptions}
        onChange={(value) => updateSetting("ratingSource", value)}
      />

      <NativeDropdown<string>
        label="Minimum rating"
        description={
          listMutationDisabled
            ? "Disabled while theme compatibility mode is enabled."
            : "Only show games at or above this Steam review percentage."
        }
        value={settings.minimumRating === null ? "off" : String(settings.minimumRating)}
        dropdownOptions={minimumRatingOptions}
        disabled={listMutationDisabled}
        onChange={updateMinimumRating}
      />

      <NativeDropdown<RatingSortMode>
        label="Sort by rating"
        description={
          listMutationDisabled
            ? "Disabled while theme compatibility mode is enabled."
            : "Sort the visible Library list by Steam review percentage."
        }
        value={settings.ratingSortMode}
        dropdownOptions={ratingSortOptions}
        disabled={listMutationDisabled}
        onChange={updateRatingSortMode}
      />

      <Field
        label="Rating source notes"
        description="Filtered and unfiltered often look identical. Public API preferred falls back to internal Steam data. Sorting/filtering uses internal Steam data for performance."
        focusable={false}
        padding="standard"
      />

      {minimalDarkActive ? (
        <Field
          label="Quick Filter"
          description="Quick Filter is disabled for Minimal Dark. Use the settings panel filtering controls instead."
          focusable={false}
          padding="standard"
        />
      ) : (
        <>
          <SectionHeader title="Quick Filter" />

          <SliderField
            label="Collapsed X position"
            description="Horizontal position of the small quick filter button."
            value={settings.quickFilterCollapsedLeft}
            min={QUICK_FILTER_POSITION_LIMITS.collapsedLeft.min}
            max={QUICK_FILTER_POSITION_LIMITS.collapsedLeft.max}
            step={1}
            showValue
            editableValue
            valueSuffix="px"
            onChange={(value) => updateSetting("quickFilterCollapsedLeft", value)}
          />

          <SliderField
            label="Collapsed Y position"
            description="Vertical position of the small quick filter button."
            value={settings.quickFilterCollapsedTop}
            min={QUICK_FILTER_POSITION_LIMITS.collapsedTop.min}
            max={QUICK_FILTER_POSITION_LIMITS.collapsedTop.max}
            step={1}
            showValue
            editableValue
            valueSuffix="px"
            onChange={(value) => updateSetting("quickFilterCollapsedTop", value)}
          />

          <SliderField
            label="Expanded X position"
            description="Horizontal position of the opened quick filter panel."
            value={settings.quickFilterPanelLeft}
            min={QUICK_FILTER_POSITION_LIMITS.panelLeft.min}
            max={QUICK_FILTER_POSITION_LIMITS.panelLeft.max}
            step={1}
            showValue
            editableValue
            valueSuffix="px"
            onChange={(value) => updateSetting("quickFilterPanelLeft", value)}
          />

          <SliderField
            label="Expanded Y position"
            description="Vertical position of the opened quick filter panel."
            value={settings.quickFilterPanelTop}
            min={QUICK_FILTER_POSITION_LIMITS.panelTop.min}
            max={QUICK_FILTER_POSITION_LIMITS.panelTop.max}
            step={1}
            showValue
            editableValue
            valueSuffix="px"
            onChange={(value) => updateSetting("quickFilterPanelTop", value)}
          />

          <ButtonItem
            label="Reset quick filter position"
            onClick={resetQuickFilterPosition}
          >
            Reset position
          </ButtonItem>
        </>
      )}

      <SectionHeader title="About" />

      <Field
        label="How the percentage is calculated"
        description="The badge shows positive reviews divided by total reviews, rounded to the nearest whole number. Non-Steam games and entries without review data may not show a badge."
        focusable={false}
      />

      <ButtonItem label="Reset all LibraryIQ settings" onClick={resetSettings}>
        Reset all settings
      </ButtonItem>
    </>
  );
}
