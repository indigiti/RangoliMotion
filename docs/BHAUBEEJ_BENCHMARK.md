# Bhaubeej Footprints — Semantic Draw Mode Benchmark

**Source:** user-provided Bhaubeej rangoli from the second Diwali collage, gallery record `b-06`. The source is an image reference; reusing the underlying artwork requires permission verification.

**Status:** hand-authored *reference reconstruction* for preview animation. It is **not a verified traditional drawing tutorial**. The artistic outline order and positions are engineering estimates until a reviewer approves them.

## Why this exists

Prior raster tracing produced hundreds of jagged, intersecting segments, square-like beads, broken Marathi characters and sparse colour fragments. Counting contours does not establish visual fidelity.

`bhaubeej-model.js` uses deliberately constructed smooth vector shapes, separate from `powder-trace.js` and `image-processor.js`. It is loaded after `drawable-designs.js` and before `studio.js`, adding model `b-06`.

## Required semantic components

| Component | Required |
|---|---|
| Red footprints (left/right) | 2 smooth, recognizable mirrored silhouettes |
| Individual red toes | 10 |
| Outer bead ring | 78 smooth, isolated white discs |
| White-petaled flowers | 7 composed clusters |
| Green leaves | 12 individually bounded leaf regions |
| Central diya | 1 layered bowl, oil lip, flame and highlights |
| Marathi nameplate | vector plaque + final-stage text `६. भाऊबीज` |

The text is rendered as a **final decorative overlay**, not fabricated character-by-character tracing. Fonts must support Devanagari. No OCR-generated glyph tracing is claimed.

## Mandatory animation timeline

1. `dots`: place dots tied to actual stroke paths, including the 78 bead centers.
2. `outline`: draw every smooth component path in authored order. No bitmap reveals and no colour fills.
3. `outline_complete`: show all paths, without any fills, for a positive hold interval.
4. `fill`: fill each bounded vector region sequentially with its authored powder colour.
5. `final`: reveal the Marathi label on the plaque and hold the complete composition.

Never show the original b-06 raster asset in the Canvas as a false generated drawing. It is allowed as a clearly labeled **reference image** in the gallery only.

## Structural CI acceptance

- `b-06` must remain `vector_draw` and refer to the authored model, not the upload-processing pipeline.
- A nonempty set of finite paths/fills and geometry-linked dots is required.
- The component counts above, including Marathi text, must remain intact.
- Any stroke with kind `auto_trace` or `powder_line` must fail this benchmark.
- All stages must use `drawing-contract.js` and the common Canvas renderer.
- The seven authored gallery models must pass schema validation before any `digiops-release` is packaged.

## Visual review still required

A human reviewer must examine actual browser screenshots at the five distinct stage boundaries and the final frame:

- The outline stage shows **two recognisable, smoothly curved footprints** with ten distinct toes, not tessellated pixel fragments.
- The ring is a collection of rounded beads, not a connected square zigzag.
- Flowers and leaves are identifiable and separated from the footprints.
- The color stage fills entire shapes without black holes or cross-stroke scribbles.
- The Marathi words are legible and correctly positioned.
- Playback speed adjustments preserve exact stage order.

The reconstruction is intentionally simpler and more diagrammatic than the photographic original. Until a source illustrator checks fidelity and real-world stroke order, keep `tutorialCapable:false` and `verification:'reference_reconstruction_unreviewed'`.

## Future designs

Keep other 24 image assets as `image_preview` references until their meaningful elements are separately reconstructed and reviewed. Selecting one must not automatically launch the flawed raster tracer and then advertise an inaccurate tutorial. Experimental tracing may be manually requested, visibly marked as unverified, and cannot promote an asset to `vector_draw`.

No amount of additional paths, stroke duration, or colour masks substitutes for recognizing the artwork's components.
