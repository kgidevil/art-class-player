# ART 1A
SAI brand palette: #E98042, #C35B2B, #111010, #F5F2ED. Presentation photo area defaults to neutral black and uses contain. Logo is expected at public/sai-logo.jpg; fallback is text.
Timer uses an absolute deadline, advances one slide when expired, stops at end, pauses when tab hidden. Imported files use object URLs and remain in memory only. No image uploads. Unsupported files are reported, and actual browser decode determines format support.
Windows CI includes two Chromium end-to-end flows; unit tests cover deadline, pause, extend, late tick, finish, shuffle and formatting. CI results must be inspected before marking validated.
Actual iPad Safari, home-screen installation, offline storage, screen lock, projector and 3-hour operation are deferred until final device QA per user. ART 1B is not included.

Brand asset: 240×134 JPEG preview derived from the supplied logo, resized/compressed for header use; full-resolution original not transferred. No redesign.

## Final validation — 2026-11-27
- Stable commit: eb468662f73262f62d1aed4c17a3258728e18d01.
- CI: production build, 7 timer unit tests, Windows build and 2 Chromium E2E tests passed (run 45964822497).
- User-reported Windows test: **10/10 PASS** — SAI logo, black/orange UI, multiple photo import, 30-second auto advance, pause/resume, previous/next, +1 minute, no cropping, fullscreen presentation, final slide completion.
- iPad and projector hardware tests deferred to final QA by user request.
