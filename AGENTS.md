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
React + TypeScript + Vite PWA, GitHub Pages project base `/art-class-player/`. IndexedDB for imported photos; localStorage for settings and session checkpoints. Avoid network dependencies during runtime.

## Workflow
- ART 0A: docs, architecture and scaffold; validate types/build where execution is available.
- ART 1A: import photos, timed playback, projector-friendly view, pause/next/extend.
- ART 1B: offline/PWA persistence and Windows browser testing. iPad hardware validation deferred to final QA.
- Deploy Pages only after Windows and build tests pass. Never claim deployment until verified.
- Keep changes small, test, and report limitations.

## Curated content policy
Maintain public/content/catalog.json as versioned content. Stable unique IDs; retain credits, source, license and category for each item. Inspect file-level license and visual suitability before publishing; never scrape unreviewed search results or imply personality/model releases. Keep personal uploads private. Prioritize clear fully clothed full-body pose photographs and varied landscapes. Do not claim continuous automatic publishing until scheduled workflow and delivery have been verified.

## ART 2C publication
Use content/approved.json for visually inspected candidates only. Do not bypass live verification when publishing scheduled additions. Preserve existing IDs and entries, avoid near duplicates visually, note framing limitations, report failures and actual published count. Read docs/ART-2C.md. Do not force-push or alter unrelated app files.
