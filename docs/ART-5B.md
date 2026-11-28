# ART 5B — Apple Pencil pressure response

User report: basic Apple Pencil drawing works on iPad but line width appears constant. Existing code did read PointerEvent.pressure, but remapped zero to 0.5, limited pressure response to approximately 0.6–1.5× base width, and ignored changes without sufficient coordinate movement. These are possible software contributors, not proof of the hardware/browser root cause.

- Preserve valid 0–1 pressure; invalid or non-pen input uses 0.5. Pen width response is 0.15–1.85× nominal width before minimum raster width clamp. 0.5 gives nominal width. Finger/mouse and eraser remain fixed width. Record the pressure toggle at stroke start; existing strokes do not change when toggled.
- Retain pressure changes near the same location and use coalesced events when available, with a fallback to the native event.
- Advanced drawing settings include pressure enable (default on) and last completed stroke diagnostic: input identity, min/max normalized stored pressure, change detection. This is per stroke and not a live hardware calibration. A constant value cannot prove a device lacks support; vary force and compare Apple Notes. Apple Pencil USB-C does not support pressure.
- Tests: normalization, response curve, synthetic pen events with canvas pixel thickness comparisons, fixed-width toggle. Real pressure on physical iPad not yet verified. No claim of native palm rejection or full pressure support before device test. No new storage schema or original photo changes.
