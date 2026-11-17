-- Prototype mode: the operator is not authenticated yet.
-- Allow owner_id to be NULL so the trusted service-role API can persist
-- prototype records. RLS remains enabled; direct anonymous access is not granted.
-- Apply this migration AFTER 001_initial_schema.sql.

alter table public.vehicles alter column owner_id drop not null;
alter table public.inspections alter column owner_id drop not null;
alter table public.inspection_images alter column owner_id drop not null;
alter table public.comparisons alter column owner_id drop not null;
alter table public.comparison_findings alter column owner_id drop not null;

-- Keep referential integrity when owner_id is NULL in prototype mode.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inspections_vehicle_id_fk') then
    alter table public.inspections add constraint inspections_vehicle_id_fk
      foreign key (vehicle_id) references public.vehicles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'inspection_images_inspection_id_fk') then
    alter table public.inspection_images add constraint inspection_images_inspection_id_fk
      foreign key (inspection_id) references public.inspections(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comparisons_baseline_inspection_id_fk') then
    alter table public.comparisons add constraint comparisons_baseline_inspection_id_fk
      foreign key (baseline_inspection_id) references public.inspections(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comparisons_current_inspection_id_fk') then
    alter table public.comparisons add constraint comparisons_current_inspection_id_fk
      foreign key (current_inspection_id) references public.inspections(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comparison_findings_comparison_id_fk') then
    alter table public.comparison_findings add constraint comparison_findings_comparison_id_fk
      foreign key (comparison_id) references public.comparisons(id) on delete cascade;
  end if;
end $$;

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
