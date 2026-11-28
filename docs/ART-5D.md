# ART 5D — clean demonstration stage

## Device feedback (2026-11-28)
ART 5C main deployment 46152981479 succeeded. User reports actual iPad pressure response, finger actions and pinch zoom/scale working, and photo displayed at maximum fit size. The remaining UI concern is that top menus still appear during demonstration. These observations are user-reported, not independently measured; individual gesture variations, HDMI and long-session operation are not certified.

## Changes
During drawing demonstration hide the entire top header, clock, instructor preview, dock and transport. Only a translucent `시연 종료` button remains in the upper right safe area (44px minimum touch height). Escape also ends demonstration. Neither entering nor exiting changes timer state, image geometry, zoom, drawing actions or selected tool. Existing overlays return to their previous state on exit. Break or lesson completion exits demonstration. The timer continues running if already running; it is not implicitly paused. Photos and notes remain local. No drawing engine or gesture changes.

## Validation
Extend the stage regression to require one accessible button, hide top/clock/preview/bottom, maintain drawing and photo geometry, restore controls and paused time, and verify portrait exit and Escape. Latest combined CI and physical ART 5D retest pending. Keep release-candidate designation until all physical release gates are verified.
