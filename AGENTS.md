# ART CLASS PLAYER — Development Instructions

## Mission
Build an offline-first art education image timer/player optimized for iPad + classroom projector. Instructor primary workflow: import local reference images, set interval, start automatic full-screen slideshow, pause/extend/skip without losing progress.

## Guardrails
- User interface in Korean; large accessible buttons, readable timer and uncluttered projected image.
- Target iPad Safari, installed PWA, and desktop Chrome/Edge. Progressive enhancement required.
- Do not claim iPad testing without real device results.
- Keep original photos and class/session data local; never commit user images or records to public GitHub.
- Preserve image aspect ratio by default; never crop a subject unexpectedly.
- Offline after first successful install, including app shell; never assume persistent browser storage.
- Use timestamp/deadline-based timer, and deliberately handle background/tab suspension.
- Do not promise separate projector output in PWA; mirror mode first, investigate native shell later.
- Keep implementation incrementally testable. Document any unverified platform behavior.
- No paid cloud APIs or accounts necessary for the core player.
- Avoid adding any copyrighted image material as starter assets.

## Tech
React + TypeScript + Vite PWA, GitHub Pages project base `/art-class-player/`. IndexedDB for imported images and saved lesson state in a later milestone. Avoid network dependencies during runtime.

## Workflow
- ART 0A: docs, architecture and scaffold; validate types/build where execution is available.
- ART 1A: import photos, timed playback, projector-friendly view, pause/next/extend.
- ART 1B: offline/PWA persistence and iPad testing.
- Keep changes small, test, and report limitations.
