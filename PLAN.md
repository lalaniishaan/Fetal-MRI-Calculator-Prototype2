# Implementation Plan

## Increment 1 - Consensus engine foundation

- Create a strict TypeScript/Vitest project skeleton from the bare `SPEC.md`/`TEST.md` workspace.
- Encode the Phase 1 source-registry entries needed by `TEST.md` Case N2 and the `SPEC.md` TCD worked example.
- Add failing tests for GA parsing, single-source pass-through, two-source agreement, and two-source disagreement.
- Implement the minimum calculator core for model-family evaluation, z-score/percentile calculation, banding, and agreement state.
- Run unit tests, typecheck, and lint; fix any red checks.
- Update `PROGRESS.md` and commit with a message linking `SPEC.md` sections 4.2.1-4.2.3.
