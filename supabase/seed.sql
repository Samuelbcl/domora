-- =============================================================================
-- DOMORA — seed.sql  (bootstrap d'une agence démo + ton profil)
--
-- Prérequis :
--   1. Avoir appliqué supabase/schema.sql sur le projet.
--   2. Avoir créé ton utilisateur dans Supabase : Authentication > Users > Add user
--      (email + mot de passe, "Auto Confirm User" coché).
--
-- Utilisation : ouvre le SQL Editor de Supabase, colle TOUT ce fichier, Run.
-- Idempotent : tu peux le relancer sans créer de doublons.
--
-- 👉 Seule chose à adapter : l'email ci-dessous s'il diffère du tien.
-- =============================================================================

do $$
declare
  v_email     text := 'samuelbiancola@gmail.com';  -- <-- ton email de connexion
  v_user_id   uuid;
  v_agency_id uuid;
begin
  -- 1) Retrouver l'utilisateur Auth par email
  select id into v_user_id from auth.users where email = v_email;
  if v_user_id is null then
    raise exception
      'Aucun utilisateur Auth pour %. Crée-le d''abord dans Authentication > Users.', v_email;
  end if;

  -- 2) Réutiliser l'agence si un profil existe déjà, sinon créer l'agence démo
  select agency_id into v_agency_id from profiles where id = v_user_id;
  if v_agency_id is null then
    insert into agencies (name, city)
    values ('Agence Démo', 'Liège')
    returning id into v_agency_id;
  end if;

  -- 3) Lier l'utilisateur à l'agence (créé ou mis à jour)
  insert into profiles (id, agency_id, full_name, role)
  values (v_user_id, v_agency_id, 'Samuel', 'owner')
  on conflict (id) do update
    set agency_id = excluded.agency_id,
        full_name = excluded.full_name,
        role      = excluded.role;

  raise notice 'OK — user % lié à l''agence %', v_user_id, v_agency_id;
end $$;
