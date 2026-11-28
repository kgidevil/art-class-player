# ART 5B — Apple Pencil pressure response

User report: basic Apple Pencil drawing works on iPad but line width appears constant. Existing code did read PointerEvent.pressure, but remapped zero to 0.5, limited pressure response to approximately 0.6–1.5× base width, and ignored changes without sufficient coordinate movement. These are possible software contributors, not proof of the hardware/browser root cause.

- Preserve valid 0–1 pressure; invalid or non-pen input uses 0.5. Pen width response is 0.15–1.85× nominal width before minimum raster width clamp. 0.5 gives nominal width. Finger/mouse and eraser remain fixed width. Record the pressure toggle at stroke start; existing strokes do not change when toggled.
- Retain pressure changes near the same location and use coalesced events when available, with a fallback to the native event.
- Advanced drawing settings include pressure enable (default on) and last completed stroke diagnostic: input identity, min/max normalized stored pressure, change detection. This is per stroke and not a live hardware calibration. A constant value cannot prove a device lacks support; vary force and compare Apple Notes. Apple Pencil USB-C does not support pressure.
- Tests: normalization, response curve, synthetic pen events with canvas pixel thickness comparisons, fixed-width toggle. Real pressure on physical iPad not yet verified. No claim of native palm rejection or full pressure support before device test. No new storage schema or original photo changes.

## Multi-touch history gestures
User confirmed on real iPad that existing pressure input worked but its visible width change was subtle. This does not establish the new pressure curve has been tested on hardware.

Two-finger tap on the active drawing canvas undoes one drawing action; three-finger tap redoes one. Fingers must overlap in contact and release within 350 ms with at most 18 CSS px movement. Multi-touch cancels any provisional finger stroke, ignores gestures during an active pen stroke, and rejects canceled/moving contacts. Gesture recognition works with pen-only input enabled. No slide/timer navigation. Redo history is per image within the current lesson and is invalidated on a new committed drawing or clear action. Explicit undo/redo buttons remain available. iPadOS may intercept system gestures; actual two-/three-finger delivery must be checked on the iPad. Browser tests simulate PointerEvents, not physical multi-touch. No change to local photo storage.
