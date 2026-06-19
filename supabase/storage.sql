-- =============================================================================
-- DOMORA — storage.sql  (bucket "splats" + RLS multi-tenant)
--
-- À exécuter dans le SQL Editor de Supabase APRÈS schema.sql.
--
-- Modèle : bucket privé. Les fichiers sont rangés sous
--   {agency_id}/{property_id}/{uuid}.{ext}
-- et la RLS storage.objects compare le 1er segment de dossier à l'agence
-- de l'utilisateur courant (public.current_agency_id()). Lecture via signed URL.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('splats', 'splats', false)
on conflict (id) do nothing;

-- Lecture (nécessaire pour générer des signed URLs)
create policy "splats_agency_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'splats'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
  );

-- Upload
create policy "splats_agency_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'splats'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
  );

-- Suppression
create policy "splats_agency_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'splats'
    and (storage.foldername(name))[1] = public.current_agency_id()::text
  );
