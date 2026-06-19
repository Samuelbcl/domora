-- =============================================================================
-- DOMORA — SCHEMA.sql  (Supabase / Postgres, region eu-central-1)
-- Multi-tenant par agency_id. RLS stricte.
--
-- Modèle de sécurité :
--   - Les agences (utilisateurs authentifiés) gèrent leurs biens et voient leurs leads.
--   - Le contenu généré par les visiteurs (sessions, messages, recos, leads) est
--     écrit côté SERVEUR via la service_role key (qui bypasse la RLS), depuis
--     /api/agent, /api/restyle, /api/leads. La RLS ne donne donc aux agences
--     qu'un accès SELECT à ce qui concerne leurs propres biens.
--   - Les tours publiés sont lisibles par des visiteurs anonymes (SELECT only).
-- =============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type user_role        as enum ('owner', 'agent');
create type property_status  as enum ('draft', 'published', 'archived');
create type message_role     as enum ('user', 'assistant', 'system');
create type lead_status       as enum ('new', 'contacted', 'qualified', 'closed');

-- ----------------------------------------------------------------------------
-- Helpers
-- ----------------------------------------------------------------------------
-- updated_at auto
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- agency_id de l'utilisateur courant (SECURITY DEFINER pour éviter la récursion RLS sur profiles)
create or replace function current_agency_id()
returns uuid language sql stable security definer set search_path = public as $$
  select agency_id from profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Agences (tenants)
create table agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  logo_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Utilisateurs (1-1 avec auth.users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  agency_id   uuid not null references agencies(id) on delete cascade,
  full_name   text,
  role        user_role not null default 'agent',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_profiles_agency on profiles(agency_id);

-- Biens
create table properties (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid not null references agencies(id) on delete cascade,
  slug         text not null unique,                 -- URL publique tour/[slug]
  title        text not null,
  address      text,
  description  text,
  status       property_status not null default 'draft',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_properties_agency on properties(agency_id);
create index idx_properties_status on properties(status);

-- Captures (fichiers splat), 1 bien -> N captures (par pièce éventuellement)
create table captures (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  room_label    text,                                 -- ex. "salon", "cuisine"
  splat_path    text not null,                        -- chemin Supabase Storage
  format        text,                                 -- spz / splat / ksplat / sog
  file_size_mb  numeric,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_captures_property on captures(property_id);

-- Sessions de l'agent IA (créées côté serveur, visiteur anonyme)
create table advisor_sessions (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  agency_id     uuid not null references agencies(id) on delete cascade, -- dénormalisé pour RLS/dashboard
  preferences   jsonb not null default '{}'::jsonb,    -- usage, foyer, budget, goût...
  summary       text,                                  -- résumé généré en fin de session
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_sessions_property on advisor_sessions(property_id);
create index idx_sessions_agency on advisor_sessions(agency_id);

-- Messages de session
create table session_messages (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references advisor_sessions(id) on delete cascade,
  role          message_role not null,
  content       text not null,
  created_at    timestamptz not null default now()
);
create index idx_messages_session on session_messages(session_id);

-- Recos de l'agent (avec rationale = le "pourquoi", différenciant)
create table recommendations (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references advisor_sessions(id) on delete cascade,
  title           text,
  content         text not null,        -- la proposition d'aménagement
  rationale       text,                 -- le raisonnement (lumière, usage, circulation)
  vision_image_url text,                -- restyle 2D généré (panneau "Vision")
  created_at      timestamptz not null default now()
);
create index idx_recos_session on recommendations(session_id);

-- Catalogue produits (agency_id NULL = catalogue global partagé)
create table products (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid references agencies(id) on delete cascade,  -- NULL = global
  name         text not null,
  category     text,                  -- canapé, table, luminaire...
  retailer     text,                  -- nom du magasin (local BE)
  price_eur    numeric,
  product_url  text,                  -- lien sortant (affilié)
  image_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_products_agency on products(agency_id);
create index idx_products_category on products(category);

-- Lien reco <-> produits
create table recommendation_products (
  recommendation_id uuid not null references recommendations(id) on delete cascade,
  product_id        uuid not null references products(id) on delete cascade,
  primary key (recommendation_id, product_id)
);

-- Leads (générés en fin de session, écrits côté serveur)
create table leads (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references agencies(id) on delete cascade,
  property_id   uuid references properties(id) on delete set null,
  session_id    uuid references advisor_sessions(id) on delete set null,
  full_name     text,
  email         text,
  phone         text,
  message       text,
  consent       boolean not null default false,       -- GDPR opt-in explicite
  status        lead_status not null default 'new',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_leads_agency on leads(agency_id);
create index idx_leads_property on leads(property_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create trigger trg_agencies_updated  before update on agencies         for each row execute function set_updated_at();
create trigger trg_profiles_updated  before update on profiles         for each row execute function set_updated_at();
create trigger trg_properties_updated before update on properties      for each row execute function set_updated_at();
create trigger trg_captures_updated  before update on captures         for each row execute function set_updated_at();
create trigger trg_sessions_updated  before update on advisor_sessions for each row execute function set_updated_at();
create trigger trg_products_updated  before update on products         for each row execute function set_updated_at();
create trigger trg_leads_updated     before update on leads            for each row execute function set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================
alter table agencies                enable row level security;
alter table profiles                enable row level security;
alter table properties              enable row level security;
alter table captures                enable row level security;
alter table advisor_sessions        enable row level security;
alter table session_messages        enable row level security;
alter table recommendations         enable row level security;
alter table products                enable row level security;
alter table recommendation_products enable row level security;
alter table leads                   enable row level security;

-- AGENCIES : membres lisent leur agence
create policy "agency_members_read" on agencies
  for select using (id = current_agency_id());

-- PROFILES : on lit son agence
create policy "profiles_same_agency_read" on profiles
  for select using (agency_id = current_agency_id());

-- PROPERTIES : CRUD pour l'agence ; SELECT public si publié
create policy "properties_agency_all" on properties
  for all using (agency_id = current_agency_id())
  with check (agency_id = current_agency_id());
create policy "properties_public_read" on properties
  for select using (status = 'published');

-- CAPTURES : CRUD via l'agence du bien ; SELECT public si bien publié
create policy "captures_agency_all" on captures
  for all using (
    exists (select 1 from properties p
            where p.id = captures.property_id and p.agency_id = current_agency_id()))
  with check (
    exists (select 1 from properties p
            where p.id = captures.property_id and p.agency_id = current_agency_id()));
create policy "captures_public_read" on captures
  for select using (
    exists (select 1 from properties p
            where p.id = captures.property_id and p.status = 'published'));

-- SESSIONS / MESSAGES / RECOS : écriture côté serveur (service_role bypasse la RLS).
-- Ici on n'autorise que la lecture par les membres de l'agence concernée.
create policy "sessions_agency_read" on advisor_sessions
  for select using (agency_id = current_agency_id());
create policy "messages_agency_read" on session_messages
  for select using (
    exists (select 1 from advisor_sessions s
            where s.id = session_messages.session_id and s.agency_id = current_agency_id()));
create policy "recos_agency_read" on recommendations
  for select using (
    exists (select 1 from advisor_sessions s
            where s.id = recommendations.session_id and s.agency_id = current_agency_id()));

-- PRODUCTS : lecture publique (catalogue affichable dans le tour) ;
-- écriture par l'agence propriétaire (ou global = NULL géré côté serveur)
create policy "products_public_read" on products
  for select using (true);
create policy "products_agency_write" on products
  for all using (agency_id = current_agency_id())
  with check (agency_id = current_agency_id());

-- RECOMMENDATION_PRODUCTS : lecture par membres de l'agence concernée
create policy "recoproducts_agency_read" on recommendation_products
  for select using (
    exists (select 1 from recommendations r
            join advisor_sessions s on s.id = r.session_id
            where r.id = recommendation_products.recommendation_id
              and s.agency_id = current_agency_id()));

-- LEADS : insert côté serveur (service_role) ; lecture + update par l'agence
create policy "leads_agency_read" on leads
  for select using (agency_id = current_agency_id());
create policy "leads_agency_update" on leads
  for update using (agency_id = current_agency_id())
  with check (agency_id = current_agency_id());

-- =============================================================================
-- NOTE : créer un bucket Storage "splats" (privé) + policies d'accès via signed URLs
-- ou lecture publique restreinte aux biens publiés (à gérer côté app/Storage).
-- =============================================================================
