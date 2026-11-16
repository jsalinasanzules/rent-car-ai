# Project Context

## Product goal

Build a vehicle inspection platform that can eventually compare vehicle photographs from different inspections and use AI to identify potential new damage. The immediate goal is much smaller: validate the workflow for selecting and organizing multiple photos of one vehicle inspection.

## Current milestone: photo-selection prototype

The initial screen should let an operator:

1. Start a vehicle photo-selection session (do not invent a full vehicle/customer management workflow).
2. Select multiple photographs in one interaction where the browser/device supports it.
3. Associate each photo with a predefined vehicle view/shot type.
4. Preview the selected photographs.
5. Remove or replace a selected photograph before saving/uploading.
6. See clear validation and upload/save feedback if persistence is included in the implementation.

Suggested shot catalogue for the first iteration:
- Front
- Rear
- Left side
- Right side
- Front-left corner
- Front-right corner
- Rear-left corner
- Rear-right corner
- Dashboard / odometer (optional)
- Interior (optional)
- Other detail

The UI should not require every shot type to be selected. A user may select several different shots. Avoid assuming that a single photo is sufficient to represent the whole vehicle.

## Current architecture decisions

- Database: Supabase PostgreSQL.
- Image storage: Supabase Storage.
- Storage bucket: private; choose a stable name such as `vehicle-inspection-photos` and document it in the migration/setup instructions.
- No AWS services in this milestone.
- No Claude API or AI damage analysis in this milestone.
- No OpenCV, image enhancement pipeline, or asynchronous queue in this milestone.
- Store image metadata and Storage object paths in PostgreSQL; do not store binary image data in database rows.
- Preserve original image files.
- Keep credentials in environment variables. The Supabase service-role key is server-only and must never be bundled into frontend code.

## Architecture items not yet decided

The repository currently has no application code or framework. Before scaffolding, inspect the current state (including hidden files and branches if available) and propose a minimal stack consistent with the prototype. Do not silently select a framework or introduce a separate backend server if Supabase client + database policies are sufficient for this first milestone.

Authentication and tenant model are not yet specified. Do not create permissive public policies for private inspection images. If persistence depends on authentication, document the required auth assumption and ask for approval before implementing a production access model. A local-only UI prototype can be developed independently while this is clarified.

## Future direction (not current scope)

A later milestone may:
- Compare a baseline image with a current image for the same vehicle zone.
- Send the two images to Claude Vision from a trusted server-side function.
- Return structured findings and an `INCONCLUSIVE` outcome when comparison is unreliable.
- Store analysis results and support human review.

Any future AI analysis must use server-side credentials, application-owned Storage references, and validation data. Do not begin this work as part of the current photo-selector tasks.