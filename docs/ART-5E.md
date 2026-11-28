# ART 5E — Compact dashboard

## Scope
User approved icon-first home redesign while independently checking ART 5D-2. Home defaults to one compact screen: small brand and offline status, classroom selector, photo count, time per photo, total duration, prominent Start. Five vector-icon navigation buttons (Home, Materials, Time, Lessons, Settings) include short Korean labels and current-page state. No new icon dependency. Clicking photo/time summary opens respective page. Materials contains local photo import/filter/list and provided catalog; Time contains all presets and direct input; Lessons preserves class/program/history controls; Settings contains playback preferences, storage, backup, update/version. Critical recovery/update/storage errors stay visible, with progress and notices for operations. All pages remain mounted while dashboard is active but hidden when inactive so catalog auto-download and unsaved program edits continue across navigation. The lesson player itself and storage schema are unchanged; returning from lesson or reloading goes Home. Settings edits retain existing immediate-save semantics; Time Apply returns home. Backup replacement remains explicit and validated. Dashboard does not load external icon assets.

## QA
Existing browser regressions routed through visible menu buttons without dropping the original data, timer, program, backup, offline, art and drawing assertions. New test checks home at 1194x834, 834x1194, 800x560 and 390x844, single-screen layout under normal state, touch targets, hidden panels, navigation, reload persistence and start. Exceptional warnings/recovery can require scrolling. CI and physical iPad layout verification complete (see acceptance below). ART 5D-2 physical acceptance was reported complete. Keep release candidate until remaining physical release gates are verified.

## Device acceptance — 2026-11-28 (user-reported)
ART 5E: all eight requested real-iPad checks passed:
- Home design and readability.
- Start button visible without scrolling.
- All five bottom navigation buttons work.
- Existing photos and classroom data retained.
- Time configuration and lesson start.
- Art materials access and photo import.
- Portrait and landscape UI layout.
- Existing presentation, demonstration and drawing functions retained.

PR browser regression run 46155930373 passed 21/21; merge 002af368; main deployment 46156097838 completed successfully. ART 5E UI acceptance is complete. Remaining physical release gates: offline cold launch and local automatic playback, session recovery, USB-C/HDMI projector mirroring and legibility, real three-hour session and screen wake, validated backup/restore. No individual unreported hardware checks are inferred; retain v1.0.0 RC1. No private photos or classroom records published.
