# ART 5D — clean demonstration stage

## Device feedback (2026-11-28)
ART 5C main deployment 46152981479 succeeded. User reports actual iPad pressure response, finger actions and pinch zoom/scale working, and photo displayed at maximum fit size. The remaining UI concern is that top menus still appear during demonstration. These observations are user-reported, not independently measured; individual gesture variations, HDMI and long-session operation are not certified.

## Changes
During drawing demonstration hide the entire top header, clock, instructor preview, dock and transport. Only a translucent `시연 종료` button remains in the upper right safe area (44px minimum touch height). Escape also ends demonstration. Neither entering nor exiting changes timer state, image geometry, zoom, drawing actions or selected tool. Existing overlays return to their previous state on exit. Break or lesson completion exits demonstration. The timer continues running if already running; it is not implicitly paused. Photos and notes remain local. No drawing engine or gesture changes.

## Validation
Extend the stage regression to require one accessible button, hide top/clock/preview/bottom, maintain drawing and photo geometry, restore controls and paused time, and verify portrait exit and Escape. Latest combined CI and physical ART 5D retest pending. Keep release-candidate designation until all physical release gates are verified.

## Reference paper opacity
Add a quick drawing-dock photo-opacity slider (0–100%, step 5) and reset to 100%. Lowering opacity displays the reference/processed photo over white without changing ink opacity, original bytes, zoom, or geometry. 0% gives a white drawing surface; 100% restores the configured background. Setting persists across drawing/demonstration within a lesson and is visually suspended outside drawing mode; new lessons reset to 100%. Original comparison pane remains the original reference. Dark pen colors are recommended on white paper. No gesture-engine change. Automated coverage added; actual iPad check pending.

## Physical device acceptance (2026-11-28)
Main deployment run 46154637122 completed successfully. User supplied a completed six-of-six iPad checklist: all menus hidden during drawing demonstration, translucent exit only, photo opacity adjustable, white background applied, ink remains visible, and tools restore on exit. These are user-reported real device observations. Prior ART 5C pressure and finger gesture feedback remains recorded. No HDMI, offline cold-start, endurance or backup/restore claim is inferred.

## ART 5D-2: clean presentation
User requests presentation (distinct from drawing demonstration) to show only remaining time and translucent presentation exit. Hide header/counter, transport, tools and progress bar; place translucent timer in upper left and exit in upper right safe areas. Existing show-timer setting is honored. Exit returns to ordinary player; Escape also works. Completion screen and normal timer/transition behavior retained. No drawing engine or photo geometry changes. Updated browser test covers one accessible button, translucent overlays, portrait safe placement, restored time and hidden timer preference. New build/device verification pending. ART 5E dashboard redesign remains deferred.
