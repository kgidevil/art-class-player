# ART 5A — iPad screenshot feedback

2026-11-28: three user screenshots confirm installed ART 4C RC1 interface, 28 photos, 20-minute selection, timer, wake-lock status text, drawing dock and offline-ready indicator. Not proof of offline cold start, Pencil, HDMI or endurance.

Changes: smaller preparation header and spacing; start action and total near top; vertically aligned source filters; separate nonwrapping slide counter; compact landscape player header; move pen width to advanced options to reclaim image area. Keep all controls, data and original aspect ratio. A separate 800×560 CSS viewport regression is an approximation for compact landscape layouts, not a measurement of the physical iPad viewport. CI and physical device retest pending. Do not mark final release or clear browser storage.


## Device acceptance — 2026-11-28 (user-reported)
ART 5A RC1: all six requested checks passed on the user's iPad:
- Start action visible on the initial screen.
- Reduced logo/header spacing.
- Classroom and slide counter wrapping corrected.
- Reduced drawing dock height.
- Existing 28 photos and settings retained.
- Apple Pencil drawing works.

PR CI 46151228459 passed; merge 87e54d1; main CI and Pages deployment 46151418676 passed. ART 5A layout acceptance is complete. Apple Pencil basic drawing is confirmed; pressure response, palm rejection, pen-only input and long-session performance are not separately confirmed.

Remaining release gates: offline cold launch and local playback; USB-C/HDMI projector mirroring and legibility; real three-hour session and screen wake behavior; session recovery and device backup/restore. Keep release candidate status until remaining physical checks pass. No private photos or learner records published.
