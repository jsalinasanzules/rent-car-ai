# TASK-002 — Frontend: One-Screen Baseline/Current Multi-Photo Selector

**Status:** Ready  
**Priority:** High  
**Scope:** One screen; no direct Claude API calls.

## Objective

Build one focused screen where an operator selects multiple vehicle photos for a previous (baseline) inspection and a current inspection, assigning each photo to a matching vehicle zone so the backend can compare them.

## UI layout

- Page title and short explanation.
- Two clearly separated sections or tabs:
  - Previous inspection (baseline)
  - Current inspection
- Same predefined vehicle-zone catalogue in both sections:
  - Front
  - Rear
  - Left side
  - Right side
  - Front-left corner
  - Front-right corner
  - Rear-left corner
  - Rear-right corner
  - Interior
  - Dashboard / odometer
  - Other detail
- Each section supports selecting multiple image files in one action and adding more files later.
- Each selected photo shows thumbnail, filename, and assigned zone.
- Allow removing/replacing a photo.
- Show which zones have a matching photo on both sides and are ready for comparison.
- Show unmatched zones as incomplete; do not compare them.
- Provide a Compare button, disabled until at least one valid matching zone exists and persistence/integration tasks are complete.
- Display loading, completed, failed, and inconclusive states.

## MVP pairing rule

Support one photo per zone per inspection for deterministic pairing. If the user selects another photo for a zone already occupied, ask whether to replace it; do not silently overwrite. Multiple photos across different zones are supported.

## Validation and UX

- Accept supported image formats (JPEG, PNG, WebP; confirm compatibility).
- Enforce configurable file-size and image-count limits.
- Preserve original files.
- Do not require every zone to be filled.
- Revoke browser object URLs when previews are removed or the component is disposed.
- Responsive and keyboard accessible.
- Clearly distinguish local preview from saved/uploaded state.
- Do not expose API keys or call Anthropic directly from the browser.

## Acceptance criteria

- [ ] One screen contains baseline and current photo sections.
- [ ] User can select multiple photos for each inspection and add more later.
- [ ] Each photo is assigned to a predefined zone.
- [ ] Same-zone pairs are clearly identified.
- [ ] Duplicate zone selection prompts for replacement.
- [ ] Thumbnails, filenames, remove/replace actions work.
- [ ] Invalid/oversized files show clear feedback.
- [ ] Compare action is only enabled when valid pairs exist and backend integration is available.
- [ ] Desktop and mobile layouts work.
- [ ] Relevant tests, lint, type-check, and build checks are run.

## Verification evidence

_To be completed by the implementing agent._

## Notes

Inspect the repository before selecting/scaffolding a frontend framework. No framework is assumed.
