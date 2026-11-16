# MVP Architecture — Vehicle Photo Selection

## Goal

Deliver one simple screen that can select multiple vehicle photographs and organize them by shot type. Persist image objects in Supabase Storage and metadata in Supabase PostgreSQL when the access model is confirmed.

## High-level flow

1. User opens the photo-selection screen.
2. User chooses one or more image files.
3. The UI validates supported image formats and a configurable maximum file size.
4. The UI displays previews and lets the user remove or replace files.
5. Each photo is associated with a predefined shot type.
6. On save, the application uploads original files to a private Supabase Storage bucket.
7. The application records metadata and Storage object paths in PostgreSQL.
8. The UI displays success or actionable errors.

## Suggested initial shot types

Use stable machine values and human-readable labels:

| Value | Label |
|---|---|
| `front` | Front |
| `rear` | Rear |
| `left_side` | Left side |
| `right_side` | Right side |
| `front_left_corner` | Front-left corner |
| `front_right_corner` | Front-right corner |
| `rear_left_corner` | Rear-left corner |
| `rear_right_corner` | Rear-right corner |
| `interior` | Interior |
| `dashboard` | Dashboard / odometer |
| `detail` | Other detail |

The user can select multiple shot types. Whether multiple photos may be assigned to the same shot type should be configurable in the UI; do not impose a one-photo-per-type database constraint unless product requirements confirm it.

## Supabase responsibilities

### Storage

- Use a private bucket for inspection images.
- Store original image files, not base64 strings.
- Generate object paths that are unique and scoped to the inspection/session.
- Do not expose the service-role key in the frontend.
- Do not use public object URLs for private inspection images.

### Database

Persist only the metadata needed by the prototype, such as:
- image record ID
- inspection/session ID
- shot type
- Storage bucket and object path
- original filename
- MIME type
- file size
- creation timestamp

The exact schema and access policies must reflect the authentication/tenant model. That model is not yet defined. Do not invent a permissive RLS policy to make uploads work.

## Security and validation

- Allow only supported image MIME types (initially JPEG, PNG, and WebP; confirm browser support and product needs).
- Enforce a reasonable configurable file-size limit.
- Validate file metadata on the client for user feedback and at the trusted storage/database boundary for security.
- Keep the bucket private.
- Apply Supabase Row Level Security and Storage policies before enabling real-user uploads.
- Never accept arbitrary external image URLs as a substitute for owned Storage object paths.

## Explicitly out of scope

- Claude Vision or any other AI inference.
- Before/after image comparison.
- Damage detection, bounding boxes, severity scoring, or PASS/FAIL decisions.
- OpenCV, Sharp-based enhancement, or other image processing.
- AWS, SQS, or other cloud infrastructure.
- PDF generation, partner webhooks, multi-tenant API keys, and production deployment automation.

## Open decisions

1. What authentication provider/user model will own each inspection?
2. Is this prototype single-tenant initially, or must tenant isolation be present from day one?
3. What is the maximum file size and maximum number of photos per inspection?
4. Can one shot type contain multiple photos?
5. Should the first increment only preview locally, or should it also upload and persist to Supabase?

Do not block the local photo-selection UI on questions that do not affect it. Resolve the persistence/security decisions before enabling real uploads.