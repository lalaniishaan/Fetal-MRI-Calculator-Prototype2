# Progress

## Completed

- Increment 2:
  - Added basic structured report generation for `SPEC.md` 4.1 findings and impression output.
  - Added the first DDx trigger from `SPEC.md` 4.6 / `TEST.md` section 3: mild ventriculomegaly when either atrial diameter is 10.0-14.9 mm.
  - Added the required isolated mild-VM impression text from `TEST.md` Case M1.
  - Added tests covering the normal-control report and bilateral isolated mild ventriculomegaly.

- Increment 1:
- Created the initial TypeScript/Vitest project scaffold.
- Implemented the registry-driven normative model evaluator for the model families in `SPEC.md` 4.2.1:
  - quadratic mean with linear SD,
  - per-percentile linear,
  - linear mean with constant SD.
- Encoded the Phase 1 computational source entries from `SPEC.md` 7.3 for the 14 baseline inputs used by `TEST.md` Case N2.
- Implemented the `SPEC.md` 4.2.3 consensus algorithm basics:
  - per-source mean, SD, z-score, percentile,
  - in-range versus extrapolated tagging,
  - in-range consensus averaging with extrapolated fallback,
  - `single` / `agree` / `disagree` agreement states.
- Added passing tests for GA parsing, single-source pass-through, multi-source TCD evaluation, and baseline source coverage.

## Open

- The full UI, report generation, clipboard workflow, differential-diagnosis engine, source-disclosure UI, methodology page, source-registry extension gate, and validation corpus are not yet implemented.
- `TEST.md` Case N2 labels several filler values as normal that are abnormal under the verbatim coefficient blocks in `SPEC.md` 7.3. The TCD worked example in `SPEC.md` 4.2.4 also reports rounded values that do not exactly match the 7.3 coefficients. Current tests intentionally verify the coefficients as printed in `SPEC.md`; a later increment should reconcile whether the implementation should prefer the coefficient manifest or the external test-corpus filler table for those conflicting rows.
