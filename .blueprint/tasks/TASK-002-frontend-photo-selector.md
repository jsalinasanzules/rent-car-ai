# TASK-002 — Frontend: React + TypeScript Multi-Photo Selector

**Status:** In Progress  
**Priority:** High  
**Stack:** React + TypeScript + Vite.

## Objective
Build one responsive screen for selecting multiple vehicle photos for previous (baseline) and current inspections, assigning each image to a matching zone.

## Requirements
- Two sections: Previous inspection (baseline) and Current inspection.
- Multi-file selection per inspection; allow adding files later.
- Zones: front, rear, left/right side, four corners, interior, dashboard/odometer, other detail.
- Show preview, filename, and assigned zone.
- Allow remove and replace.
- Show matched zones and missing counterpart photos.
- One photo per zone per inspection. Confirm before replacing an occupied zone.
- Validate JPEG, PNG, WebP and configurable file-size limit.
- Responsive and keyboard accessible.
- Revoke object URLs when removed or unmounted.
- Local preview only. Do not fake persistence or AI results.
- Keep Compare disabled until backend API integration exists.

## Acceptance criteria
- [ ] React + TypeScript + Vite scaffold exists.
- [ ] Single screen has baseline/current photo sections.
- [ ] Multiple images can be selected in one picker action.
- [ ] Each photo can be assigned to a predefined zone.
- [ ] Duplicate zone selection prompts before replacement.
- [ ] Preview, remove, and replacement work.
- [ ] Invalid/oversized files show clear validation.
- [ ] Matching zones are identified.
- [ ] Compare remains disabled without backend integration.
- [ ] Responsive desktop/mobile layout and accessible controls.
- [ ] Run lint, type-check, tests, and build where configured; record actual results.

Verification evidence to be completed after actual checks.
