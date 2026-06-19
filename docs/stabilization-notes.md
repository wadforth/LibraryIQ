# LibraryIQ Stabilization Notes

This file is for the current v0.2.5 stabilization pass. Remove temporary debug logging before publishing a final release.

## Current Quick Filter Functions

- `QuickFilterBar` in `frontend/components/QuickFilterBar.tsx` owns quick filter state and rendering.
- `isInSteamLibraryContext` hides the quick filter outside Library by checking Store/Community URLs, LibraryIQ sidebar markers, and the last Library context signal.
- `markLibraryContextObserved` in `frontend/steam/libraryContext.ts` is called by sidebar patch code when actual Library rows/icons render.
- `getQuickFilterButtonStyle`, `getActiveLabel`, and `getCollapsedLabel` define the current custom quick-filter presentation.
- `updateSetting` writes quick-filter button choices back through `useLibraryIqSettings`.
- Position settings are `quickFilterCollapsedLeft`, `quickFilterCollapsedTop`, `quickFilterPanelLeft`, and `quickFilterPanelTop`.

## Known Issues To Avoid Repeating

- Do not switch the quick filter to a body portal without evidence. It previously made Minimal Dark geometry measurable but broke other themes and Steam contexts.
- Do not return body-mounted DOM from the Millennium global nav injection path. Steam can treat it as a nav child.
- Do not do a broad settings-panel rewrite without checking this repo's actual `@steambrew/client` exports first. This SDK has `DropdownItem` via `components/Dropdown`, plus `ToggleField`, `SliderField`, `ButtonItem`, and `Field`.
- Do not assume `localStorage` events cross all Steam WebUI documents. Verify with logs before relying on live cross-context updates.
- Do not use broad small-icon asset matching for badges. Steam tray/context menus also render small app assets; require Library sidebar-specific evidence.
- Do not mutate or reorder the virtual Library list for known risky themes until diagnostics confirm the list renderer is the real Library list.

## Design Notes

- Current quick filter and settings panel are custom/AI-styled and should be converted carefully toward Steam/Millennium-native controls.
- The previous native settings attempt fixed some toggle behavior but caused design/spacing regressions during the larger quick-filter experiments. Convert incrementally.
- If Minimal Dark quick filter visibility cannot be fixed safely, leave the quick filter limitation documented and ensure the settings panel filtering/sorting path works.

## Product Wording Notes

- LibraryIQ targets the Steam Library sidebar/list, not Steam Grid View.
- Steam Grid View can already sort by Metacritic/Steam reviews, but this plugin adds visible percentages, filtering, and sorting to the Library sidebar/list experience.
- `Public API preferred` currently means Steam's public `appreviews` endpoint via the backend, not a user-supplied Steam Web API key.
