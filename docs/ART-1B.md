# ART 1B — v0.3.0

## Implemented scope
- IndexedDB stores original imported blobs, ordered numeric IDs and filenames. No network upload. Add/delete uses completed transactions before UI confirmation.
- Local browser settings and unfinished-session checkpoints. Recovery requires explicit choice; queue and remaining time restored paused, no automatic advance due to elapsed offline time. Checkpoint every displayed second and on pagehide; sudden power loss may lose the last second or uncommitted data.
- Service worker precaches the production output, manifest, logo and icons. No network required after the first successful controlled load. Updates wait until instructor applies them in setup, or all old clients close; no forced reload during a lesson.
- Screen Wake Lock best effort; visibility suspension pauses existing timer. Browser/OS may deny or release the lock.
- Pages workflow deploys dist after passing build and Windows Chromium tests; repository Pages source must be GitHub Actions.
- Photos/settings are per origin and browser profile. Localhost and GitHub Pages are separate; no automatic cross-origin migration. Do not clear site data. Persistent storage permission is optional, not guaranteed. Backups come in ART 4A. Avoid simultaneous editing in multiple tabs.

## Validation
- Automated Windows Chromium: previous two regression flows plus persistence/recovery/delete and offline reload/playback.
- Actual Windows browser user test pending; iPad Safari, PWA installation, wake lock, HDMI and 3-hour test deferred to ART 4A.
- Pages activation and live URL require actual deployment verification; not assumed.
