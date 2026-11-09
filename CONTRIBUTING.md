# Contributing to RangoliMotion

Start with [the mandatory drawing rules](docs/RANGOLI_DRAWING_RULES.md) and [agent instructions](AGENTS.md).

Before submitting a change, run `node tests/drawing-contract.test.js` and `node tests/runtime-smoke.test.js`, then check the browser sequence:

1. Guide dots appear before any strokes.
2. Every outline stroke is painted gradually from its actual path, not revealed as a bitmap.
3. A separate complete-outline frame is held **before any fill appears**.
4. Independent colour regions fill in sequence, clipped to their boundaries.
5. Only then the artwork enters its final-detail/hold stage.

User-upload, drag/drop and background reprocessing paths must use the same validated experimental auto-tracer or fail closed. Gallery images without an authored model remain reference-only unless a user explicitly opts into experimental tracing. See [Bhaubeej benchmark](docs/BHAUBEEJ_BENCHMARK.md) for semantic component requirements. Keep `image_auto_trace` unverified and clearly labelled. Only hand-reviewed geometry can be promoted to tutorial capability. Validate the expected component count and a screenshot of the completed **outline-only** stage, not just an algorithmic stroke count.

Do not add dependencies, network image uploads, personal data collection or a database merely to process local imagery. Preserve DigiOps Cloudways artifact packaging as a static site. Verify rights in all supplied image assets.
