# ART CLASS PLAYER Roadmap

## Purpose
An iPad-first visual reference player for senior adult drawing classes in Cheongun and Danwol, later useful for portrait, still-life and landscape sessions.

| Stage | Scope | Acceptance check |
| --- | --- | --- |
| ART 0A | Repo setup, technical risk review, React/TS/Vite skeleton | Structure and documentation committed; build requires CI confirmation |
| ART 1A | Multi-image import, interval timer, full-screen presentation, pause/next/+time | Image advances on schedule; no unwanted crop; teacher can override |
| ART 1B | PWA, offline asset cache, local image storage, safe resume, Pages | Windows offline and recovery tests; final iPad QA deferred |
| ART 2A | Curated reference catalog, downloads, category/difficulty/search, local photo separation | Verified content metadata, category playback, offline saved reference |
| ART 2B | Independent catalog updates, download improvements, favorites, user tags, storage optimization | New content without application code changes |
| ART 2C | Recurring curation and publication workflow | Rights-reviewed content packs; explicit schedule and tested publication |
| ART 2D | Classes, usage history, lesson plans, presets, smart no-repeat | Cheongun and Danwol histories independent |
| ART 3A | Grayscale, tone steps, grid, flip, zoom and image adjustments | Edits never alter original |
| ART 3B | Presenter controls, next-slide preview, optional drawing overlay | Verified feasible on supported devices |
| ART 4A | Backup/restore, long-session QA and memory tuning | 3-hour real-class projection test |

## Product decisions
1. **Offline-first:** The application shell is cached; photos/records stored locally after import, with explicit ZIP backup later.
2. **Instructor control:** Automatic slide changes may be delayed, paused or extended; the app never penalizes a learner for needing more time.
3. **Projector:** Initial mode is iPad display mirroring. Extended two-screen output must not be claimed without native implementation and physical testing.
4. **Class data safety:** Browser site storage may be evicted or cleared; backup/export and storage warnings are important.
5. **Teacher UX:** Korean labels, large targets, high-contrast timer, portrait images shown using contain.
6. **Privacy:** Do not upload privately sourced photos or individual learner info to GitHub.

## iPad PWA known risks (to validate)
- iOS/iPadOS browsers restrict background timers, persistent file-folder access and wake-lock behavior; use elapsed/deadline timestamps and recover on foreground.
- Service workers require HTTPS and a successful initial install; offline reload is not guaranteed until caching succeeds.
- Home-screen PWA and Safari do not promise unrestricted filesystem access; use user-selected files and IndexedDB.
- HDMI/projection setup and external-display mirroring are hardware- and OS-dependent.
- Browser-managed image blobs can use significant quota; resize thumbnails and monitor storage separately.
- No access to physical iPad from repository-only workflow; mark real-device checks pending.

## ART 0A completion checklist
- [x] GitHub repository access confirmed.
- [x] Architecture and roadmap documented.
- [x] React TypeScript Vite starter source committed.
- [x] Install dependencies and run production build in CI/local runtime.
- [ ] Verify iPad Safari and external projector in person.

## Later: class session sample
1min × 5, 3min × 5, 5min × 5, break 10min, 10min × 5, 20min × 2. These timings are configurable.

## Stage status
- ART 0A: complete (CI build).
- ART 1A: complete (CI 9/9 functional tests, user 10/10).
- ART 1B: Windows user 10/10 and CI 4/4 browser tests passed; Pages activation blocked (configure-pages 404).
- ART 2A: catalog pilot and local download implementation; CI and live download verification pending.
- iPad, HDMI and long-session verification: ART 4A final hardware QA, per user request.

- ART 2A: user Windows 9/9, unit 7/7, browser 5/5. Pages activation pending.
- ART 2B: user 12/12, CI 13/13, high severity audit passed; Pages activation pending.
- ART 2C: live publisher passed, catalog v4 / 28; Windows build/browser passed. Weekly task scheduled, future runs pending.
- ART 2D: variable lesson programs, breaks, reusable presets, class profiles, usage history and unused-first selection implemented; CI pending.
