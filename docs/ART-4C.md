# ART 4C — Image-first UI refinement

## Design direction
Keep all ART 1A–4A functions, local photo bytes, backups, class data, catalog licensing and offline behavior. SAI orange is reserved for primary actions, selected states and progress. The reference image is the focal point. Use Korean labels, consistent type scale, dark neutral surfaces, high contrast, and 44 CSS px touch targets for normal iPad layouts.

## First pass (this branch)
- Compact player brand/header, narrower timer sidebar, larger relative image area, readable neutral timer, compact transport and drawing controls.
- Improve small labels and normal-size touch targets across preparation, library, lesson editor and backup controls.
- Keep all existing actions and event handlers, preserve original aspect ratio and avoid overlays on the image.
- Add Playwright layout checks at 1194×834 and 1024×768. Real iPad, Pencil, HDMI, offline and 3-hour checks are still pending. Chromium viewport checks are not physical iPad validation.

## Next iterations (not implemented)
1. Preparation dashboard: put classroom, image source, duration and start at the top; group materials, lesson programs/history and settings as secondary views. Preserve access to recovery and backups.
2. Presentation: image-first focus mode with optional timer, easy explicit control reveal/exit, no accidental touches interrupt drawing, no loss of attribution access. Separate instructor controls from viewing only within mirrored display constraints.
3. Drawing and art tools: compact contextual tool groups, advanced settings collapsed, pencil-only input and coordinate alignment maintained. Test with Apple Pencil and projector before release.
4. Check contrast, touch targets, orientation, long Korean labels, no clipping and safe-area behavior; verify existing functional and backup regression suites. No storage schema migration, new native app or paid service.


## Second pass (ART 4C-2/3)
- First-pass PR CI run 46149562459 completed successfully (build and Windows browser checks). This is not iPad verification.
- Reorder preparation: quick classroom picker, image count and duration summary, image/time setup first; materials, class management, settings/backup below. Four section links jump to the relevant content; they are not separate screen routes. All sections remain mounted to preserve existing library refresh and download state. Both classroom selectors use the same persisted lesson state.
- Presentation starts with focus view by default. Hide transport and extra header tools; retain explicit "조작 표시" and "발표 종료" controls and the optional timer. Show controls to access attribution, transport and timer visibility, then re-enter focus. Closing tool panels and returning to move mode prevents invisible active ink input. The timer and original image aspect ratio are unchanged.
- Additional browser test verifies shared classroom selection, section navigation, image height, paused timer continuity and reversible controls. Current branch CI pending. No main merge or Pages deployment until review.
- Remaining: dedicated screen navigation if useful after user review; compact contextual drawing controls/advanced settings; actual device orientation, Pencil, HDMI and offline/endurance testing. No promise of separate projector display.


## Third pass (ART 4C-4, partial 4C-5/6)
- Second-pass CI 46149773123 completed successfully. Physical iPad QA remains pending.
- Drawing dock: move/pen/eraser/undo, color and width always accessible; opacity, pen-only, visibility and clear-all in reversible advanced disclosure. Active pen-only/hidden-ink indicators visible even when collapsed.
- Art dock: image analysis modes, grid and reset always available; flips, original comparison, color adjustments and zoom in advanced disclosure. Values and per-photo ink actions remain in existing parent state. Tool components have local disclosure state only.
- Shared responsive dock uses normal flow, not a floating overlay, to avoid blocking image or ink coordinates. 44 CSS px button targets and scrollable details. No icon-only controls in this implementation; Korean text labels preserved.
- Updated existing art/drawing tests to explicitly open advanced settings; added portrait tablet 834×1194 and phone 390×844 viewport checks, disclosure state preservation, art comparison, paused timer continuity. New CI not yet confirmed.
- Remaining: full UI polish, transport simplification if needed, actual iPad portrait/landscape and pencil/HDMI/3-hour testing, main merge and Pages deploy only after regression review.
