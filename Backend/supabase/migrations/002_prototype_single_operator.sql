-- Prototype mode: the operator is not authenticated yet.
-- Allow owner_id to be NULL so the trusted service-role API can persist
-- prototype records. RLS remains enabled; authenticated direct access only
-- sees rows owned by auth.uid(), while the Node API uses its private key.
-- Apply this migration AFTER 001_initial_schema.sql.

alter table public.vehicles alter column owner_id drop not null;
alter table public.inspections alter column owner_id drop not null;
alter table public.inspection_images alter column owner_id drop not null;
alter table public.comparisons alter column owner_id drop not null;
alter table public.comparison_findings alter column owner_id drop not null;

-- Align persisted zone identifiers with the React selector.
alter table public.inspection_images
  drop constraint if exists inspection_images_zone_check;

alter table public.inspection_images
  add constraint inspection_images_zone_check
  check (zone in (
    'front', 'rear', 'left_side', 'right_side',
    'front_left_corner', 'front_right_corner',
    'rear_left_corner', 'rear_right_corner',
    'interior', 'dashboard', 'detail'
  ));

-- Keep the Storage bucket private. Prototype objects are stored below
-- prototype/{vehicleId}/{inspectionId}/... and accessed only by the API.
update storage.buckets
set public = false,
    file_size_limit = 12582912,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'vehicle-inspection-photos';
