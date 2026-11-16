# TASK-002 — Frontend: React + TypeScript Multi-Photo Selector

**Status:** In Progress  
**Priority:** High  
**Stack:** React + TypeScript + Vite.

## Objective
Build one responsive screen for selecting multiple vehicle photos for previous (baseline) and current inspections, assigning each image to a matching zone.

## Implemented in the initial frontend increment
- React + TypeScript + Vite project scaffold.
- Spanish-language inspection comparison screen.
- Separate baseline and current photo sections.
- Multi-file picker for each inspection and add-more action.
- JPEG, PNG, and WebP validation; 12 MB per-file limit.
- Local thumbnail previews, filename and size display.
- Zone assignment using the agreed vehicle-zone catalogue.
- One photo per zone per inspection; browser confirmation before replacing.
- Remove photo action and preview object-URL cleanup.
- Matched-zone indicators.
- Responsive layout and keyboard-operable native controls.
- Drag-and-drop file selection when the section is empty.
- Compare action intentionally remains disabled until backend integration exists.
- Clear local-only notice; no fake upload or AI result.

## Acceptance criteria
- [x] React + TypeScript + Vite scaffold exists.
- [x] Single screen has baseline/current photo sections.
- [x] Multiple images can be selected in one picker action.
- [x] Each photo can be assigned to a predefined zone.
- [x] Duplicate zone selection prompts before replacement.
- [x] Preview, remove, and replacement by zone work.
- [x] Invalid/oversized files show validation feedback.
- [x] Matching zones are identified.
- [x] Compare remains disabled without backend integration.
- [x] Responsive desktop/mobile layout and accessible native controls.
- [ ] Run lint, type-check, tests, and production build; record actual results.

## Verification evidence
Implementation files are committed to the repository. Automated checks have **not** been run: this session could not clone/access a local working copy because the runtime has no network DNS access to GitHub. Do not mark this task Done until the repository is checked out and npm install/build/type-check are run.

## Next work
1. Run `npm install` and `npm run build` in a local checkout.
2. Fix any compiler or browser issues discovered.
3. Connect the UI after TASK-001 and TASK-003 provide the Node.js API contract.
