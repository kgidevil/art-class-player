# ART 5F — Slim tool overlay

## Scope
User's two physical iPad screenshots showed large drawing and art panels obscuring roughly 31% and 21% of the screen height respectively (including panel only, approximate screenshot measurements). ART 5E home accepted. Replace full-width panels with centered content-width vector icon strips and separate popovers. Target default strip 54 CSS px high (44 px touch controls, padding and border), no change to maximum photo fit. Actual physical measurements pending.

Drawing: move, pen, eraser, undo/redo, current color, photo opacity, settings, demo, close. Color popup retains all seven colors. Dedicated paper popup retains 0–100% opacity/reset; settings retain width, pen opacity, pen-only, pressure switch/diagnostic, visibility and clear. Art: original, grayscale, grouped 2/3/5 tone choices, outline, grid (0/3/4/6/8), settings and close. Advanced keeps flip, compare, brightness, contrast, saturation, zoom, reset. Accessible Korean names, title hints and selected state; no network dependencies. Popovers close on outside pointer-down or Escape; no timed hiding of the main strip. On narrow phones the strip can scroll horizontally. Status notes remain visible when applicable. Drawing engine, gestures, photo transformation, timer, storage, presentation and demo behavior unchanged. Version label ART 5F RC1.

## Validation
Existing tests updated only for intentional popup interaction and dismissal; new regression checks compact strip dimensions, touch targets, exclusive popup visibility, color selection, Escape/outside dismissal, image geometry, tone/grid options at tablet landscape, portrait and compact landscape viewport sizes. Physical iPad UI acceptance complete (see below); HDMI, offline cold launch, endurance, recovery/backup gates remain pending. Do not mark final release.

## Device acceptance — 2026-11-29 KST (user-reported)
All nine requested physical iPad checks passed:
- Single-row drawing icon toolbar.
- Single-row art tool icon toolbar.
- Icon clarity and touch usability.
- Color selection popup.
- Photo opacity popup.
- Tone step and grid selection.
- Advanced settings and automatic popup dismissal.
- Photo size retained in portrait and landscape.
- Pressure, gestures, presentation and demonstration retained.

PR CI 46158658218 passed all 22 browser regressions, after correcting the opacity locator ambiguity and waiting for the fitted image to settle after rotation. Merge fa592ae; main CI and Pages deployment 46158864680 completed successfully. ART 5F UI acceptance complete. Physical overlay dimensions were not independently measured. Automatic dismissal refers to popovers, not timed hiding of the main strip. Remaining physical release gates: offline cold launch and automatic playback, session recovery, USB-C/HDMI projector mirroring, three-hour session and screen wake, validated backup/restore. Retain v1.0.0 RC1; no unreported hardware checks inferred.
