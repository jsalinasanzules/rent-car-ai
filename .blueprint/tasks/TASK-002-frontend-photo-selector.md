# TASK-002 — Frontend: Multi-Photo Vehicle Shot Selector

**Status:** Ready  
**Priority:** High  
**Scope:** One focused screen; no AI analysis.

## Objective

Build a simple, usable screen that lets an operator select multiple photographs of a vehicle and classify each photograph by vehicle view/shot type.

## UI requirements

1. Show a clear page title and short instruction.
2. Provide a predefined shot-type selector using these initial options:
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
3. Allow selecting multiple image files in one action where supported.
4. Allow adding more photos in subsequent selections.
5. Show a thumbnail preview for every selected photo.
6. Show the assigned shot type for each photo.
7. Allow removing a selected photo and replacing it.
8. Validate image type and configurable file-size limit with clear user feedback.
9. Provide an explicit save/upload action only if Supabase integration is available; otherwise keep the first UI increment local and clearly indicate that the selection has not been saved.
10. Keep the layout responsive and accessible, including keyboard-operable controls and labels.

## Interaction rules

- Do not force the user to select every shot type.
- Support several photos in one inspection.
- Do not silently overwrite an existing selection.
- Do not assume one photo per shot type unless confirmed.
- Revoke temporary browser object URLs when previews are removed or the component is disposed.
- Preserve original image files; no image transformations are required.

## Acceptance criteria

- [ ] A single screen supports selecting multiple vehicle photos.
- [ ] The user can add photos in more than one selection action.
- [ ] Each photo can be assigned a shot type.
- [ ] Thumbnails and filenames are visible.
- [ ] The user can remove and replace individual photos.
- [ ] Unsupported files and oversized files are rejected with clear messages.
- [ ] The screen works at desktop and mobile viewport sizes.
- [ ] No AWS, Claude API, image-processing, or AI inference dependency is added.
- [ ] Relevant tests, lint, type-check, and build commands are run where available.

## Verification evidence

_To be completed by the implementing agent._

## Notes

The repository was empty when this task was created. Inspect the actual stack before scaffolding; do not assume React, Angular, Next.js, or another framework without checking or confirming.