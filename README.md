# LibraryIQ

LibraryIQ is a [Millennium](https://github.com/SteamClientHomebrew/Millennium) plugin for Steam that enhances the Library sidebar with Steam review ratings, rating-based filtering and sorting, configurable badges, and a compact quick filter control.

It is designed to feel like a native Steam Library enhancement rather than a separate overlay.

<p align="center">
  <a href="https://buymeacoffee.com/kierxn" target="_blank" rel="noopener noreferrer">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50">
  </a>
</p>

## Features

- Steam review percentage badges in the Library sidebar.
- Rating source modes: filtered, unfiltered, and API preferred with internal fallback.
- Rating filters for hiding lower-rated games.
- Rating sorting with highest-first and lowest-first modes.
- Sorting/filtering support for flat Library view and grouped-by-collection Library view.
- Compact quick filter bar for changing common filters without opening settings.
- Custom badge placement before the icon, between the icon and title, or after the title.
- Badge display modes: percentage, compact number, and short review label.
- Badge styles: glass, solid, outline, and Steam neutral.
- Badge shapes: pill, squircle, rounded rectangle, and square.
- Theme compatibility mode for heavily customized Millennium themes.
- Optional badge click actions for opening Steam reviews or the store page.

## Screenshots

**Library Sidebar Badges**

<img width="255" height="355" alt="image" src="https://github.com/user-attachments/assets/3073bf3b-bbc5-4954-8047-9ebd658cc695" />

**Quick Filter Collapsed**

- Icon will change based on filters. You can also change the location within settings in real-time. Bug/Feature(?) note: the filter icon might disappear. If you click the home button it'll reappear :)

<img width="218" height="39" alt="image" src="https://github.com/user-attachments/assets/9dd8140c-96ff-48f9-b82f-5bae09415554" />

**Quick Filter Expanded**

<img width="250" height="141" alt="image" src="https://github.com/user-attachments/assets/88857d5e-a9cb-42a9-a7a3-e43f0d1c420d" />

**Settings Panel**

<img width="288" height="1368" alt="image" src="https://github.com/user-attachments/assets/105f4ad3-071b-46c0-a1cb-c1c8372503db" />

**Sorting And Filtering**

<img width="277" height="686" alt="image" src="https://github.com/user-attachments/assets/1d269e7e-86aa-4879-8d4e-f6e8a97ddefa" />

## How It Works

LibraryIQ patches Steam's Library UI through Millennium and Steam's bundled JSX runtime. It intercepts Library sidebar row rendering to add rating badges and patches the virtualized Library list props to apply LibraryIQ sorting/filtering.

The list patch keeps Steam's real app rows intact and renders the target app's actual Steam row into the current visible slot. This avoids the click, hover, and scroll bugs caused by naive virtual-index remapping.

Ratings are read from Steam's internal app data where possible. API preferred mode can fetch Steam review data through the plugin backend and falls back to internal data when unavailable.

## Quick Filter

The quick filter starts collapsed each time Steam reloads. It provides one-click controls for:

- Off
- 70+
- 80+
- 90+
- High
- Low
- Clear

The quick filter is only shown after LibraryIQ observes the Steam Library sidebar and is hidden on obvious Steam web pages such as Store and Community pages.

## Settings

LibraryIQ settings are available in the Millennium plugin settings panel.

Configurable options include:

- Show or hide sidebar ratings.
- Choose the rating source.
- Choose badge colour mode.
- Enable or disable tooltips.
- Choose badge position, style, display mode, shape, and click action.
- Enable theme compatibility mode for safer after-title badges and less invasive Library patching.
- Set minimum rating filter.
- Set rating sort mode.
- Show or hide the quick filter bar.
- Adjust quick filter collapsed and expanded positions.

Settings are stored in local storage under `library-iq-settings-v1`.

## Installation

Install [Millennium](https://github.com/SteamClientHomebrew/Millennium), then place or symlink this plugin into Steam's Millennium plugins directory.

Typical Windows plugin directory:

```text
C:\Program Files (x86)\Steam\millennium\plugins
```

After installing or updating the plugin, restart Steam.

## Development

Install dependencies:

```powershell
bun install
```

Build the plugin:

```powershell
bun run build
```

The Millennium template writes build output to:

```text
.millennium\Dist
```

Restart Steam after building:

```powershell
taskkill /F /IM steam.exe
```

## Project Structure

```text
frontend/
  index.tsx
  types.ts
  hooks/
    useLibraryIqSettings.ts
  services/
    ratings.ts
    steamAppStore.ts
    webpackRuntime.ts
  styles/
    badgeVisuals.ts
    sidebarStyles.ts
  steam/
    sidebarPatch.tsx
    libraryListPatch.ts
    libraryContext.ts
  components/
    LibraryIqSettingsPanel.tsx
    SettingRow.tsx
    SteamSidebarRatingBadge.tsx
    QuickFilterBar.tsx
backend/
  main.lua
```

## Notes And Limitations

- Steam's Library sidebar is virtualized, so the sorting/filtering patch is intentionally conservative.
- Theme compatibility mode disables LibraryIQ sorting/filtering and uses the safer after-title badge path for themes that heavily restyle Library rows.
- Custom Steam/Millennium themes are not guaranteed to work. LibraryIQ tries to avoid fragile theme conflicts, but themes that heavily rewrite Library row structure, asset sizing, or text rendering can still need theme-specific fixes.
- Shift-click range selection is treated like a normal click while LibraryIQ sorting/filtering is active to avoid selecting incorrect unsorted ranges.
- The quick filter uses LibraryIQ's observed Library sidebar markers instead of Steam UI text scanning where possible.
- API mode should not be used for bulk sorting/filtering across large libraries; sorting/filtering uses internal Steam data for performance.
- Non-Steam games and entries without review data may not show rating badges.

## Manual Test Checklist

After changes, verify:

1. Steam starts and LibraryIQ loads.
2. Sidebar rating badges appear.
3. Badge source modes work: filtered, unfiltered, API preferred.
4. Badge styles work: glass, solid, outline, Steam neutral.
5. Badge shapes work: pill, squircle, rounded rectangle, square.
6. Badge click action works: none, reviews, store page.
7. Quick filter starts collapsed.
8. Quick filter position settings update in realtime.
9. Quick filter buttons work: Off, 70+, 80+, 90+, High, Low, Clear.
10. Quick filter does not show on Store, Community, or non-Library pages.
11. Flat Library sorting works.
12. Grouped-by-collection sorting works.
13. Clicking a sorted game opens the correct game.
14. Clicking a sorted game does not permanently jump the Library list to the unsorted location.
15. Shift-click does not select incorrect unsorted ranges while LibraryIQ sorting/filtering is active.
16. Turning sorting/filtering off restores normal Steam behaviour as much as possible.
17. Theme compatibility mode keeps badges readable with SpaceTheme-style row text effects.

## License

MIT. See `LICENSE`.
