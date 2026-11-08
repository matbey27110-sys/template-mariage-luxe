-- ============================================================
--  Template mariage luxe — schéma Supabase MULTI-COUPLES
--  Un seul code et un seul projet Supabase pour tous les mariages :
--  une ligne « mariages » par couple, invités / réponses / photos rattachés à leur mariage.
--
--  À coller dans : Supabase > SQL Editor > New query > Run
--  Le script peut être relancé sans risque (il ne supprime aucune donnée).
--  S'il trouve l'ancienne table « site » (version à un seul couple), il la migre
--  automatiquement vers un premier mariage.
-- ============================================================

-- ---------- Mariages ----------
create table if not exists public.mariages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- adresse : site.fr/?m=<slug>
  domaine text unique,                                                 -- option : nom de domaine du couple
  owner_id uuid references auth.users(id) on delete set null,          -- compte des mariés (admin)
  content jsonb not null default '{}'::jsonb,                          -- version PUBLIÉE (textes, photos, apparence…)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Invités (lien personnalisé : site.fr/?invite=<slug>) ----------
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nom text not null,
  max_personnes int not null default 1 check (max_personnes between 1 and 20),
  created_at timestamptz not null default now()
);
alter table public.invites add column if not exists mariage_id uuid references public.mariages(id) on delete cascade;

-- ---------- Réponses RSVP ----------
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid references public.invites(id) on delete set null,
  nom text not null,
  email text,
  telephone text,
  present boolean not null,
  nb_personnes int not null default 0,
  accompagnants text,
  enfants int not null default 0,
  regime text,
  moments text[] not null default '{}',
  chanson text,
  message text,
  created_at timestamptz not null default now()
);
alter table public.rsvps add column if not exists reponses jsonb not null default '[]'::jsonb; -- questions personnalisées
alter table public.rsvps add column if not exists mariage_id uuid references public.mariages(id) on delete cascade;

create index if not exists invites_mariage_idx on public.invites (mariage_id);
create index if not exists rsvps_mariage_idx on public.rsvps (mariage_id);

-- ---------- Migration depuis l'ancienne version (table « site » à une seule ligne) ----------
-- Le slug est construit à partir des prénoms enregistrés (ex. « alexandra-loic »).
-- Le premier compte créé dans Authentication devient le propriétaire (modifiable ensuite dans la table).
do $$
declare
  v_content jsonb;
  v_slug text;
  v_id uuid;
begin
  if to_regclass('public.site') is null then return; end if;
  if exists (select 1 from public.mariages) then return; end if;   -- déjà migré
  select content into v_content from public.site where id = 1;
  if v_content is null then return; end if;
  v_slug := trim(both '-' from regexp_replace(lower(
              translate(coalesce(v_content #>> '{couple,prenom1}', 'mariage') || '-' || coalesce(v_content #>> '{couple,prenom2}', ''),
                        'àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ', 'aaaeeeeiioouuucAAAEEEEIIOOUUUC')),
              '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'mariage'; end if;
  insert into public.mariages (slug, owner_id, content)
  values (v_slug, (select id from auth.users order by created_at limit 1), v_content)
  returning id into v_id;
  update public.invites set mariage_id = v_id where mariage_id is null;
  update public.rsvps   set mariage_id = v_id where mariage_id is null;
end $$;

-- ---------- Sécurité (RLS) ----------
alter table public.mariages enable row level security;
alter table public.invites  enable row level security;
alter table public.rsvps    enable row level security;

-- Contenu publié : lisible par tous (c'est le site public) ; modifiable seulement par les mariés propriétaires
drop policy if exists "mariages lecture publique" on public.mariages;
create policy "mariages lecture publique" on public.mariages for select using (true);
drop policy if exists "mariages modification proprietaire" on public.mariages;
create policy "mariages modification proprietaire" on public.mariages for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Invités et réponses : uniquement ceux du mariage dont on est propriétaire
drop policy if exists "invites admin" on public.invites;
drop policy if exists "invites proprietaire" on public.invites;
create policy "invites proprietaire" on public.invites for all to authenticated
  using (mariage_id in (select id from public.mariages where owner_id = auth.uid()))
  with check (mariage_id in (select id from public.mariages where owner_id = auth.uid()));
drop policy if exists "rsvps admin" on public.rsvps;
drop policy if exists "rsvps proprietaire" on public.rsvps;
create policy "rsvps proprietaire" on public.rsvps for all to authenticated
  using (mariage_id in (select id from public.mariages where owner_id = auth.uid()))
  with check (mariage_id in (select id from public.mariages where owner_id = auth.uid()));

-- ---------- Fonctions publiques ----------
-- Retrouver un invité à partir de son lien, dans un mariage donné (sans exposer la liste complète)
create or replace function public.get_invite(p_mariage text, p_slug text)
returns table (id uuid, nom text, max_personnes int)
language sql security definer set search_path = public as $$
  select i.id, i.nom, i.max_personnes
  from invites i join mariages m on m.id = i.mariage_id
  where m.slug = lower(p_mariage) and i.slug = lower(p_slug)
  limit 1;
$$;

-- Envoyer une réponse : vérifie le mariage, la date limite et le nombre max de personnes
create or replace function public.submit_rsvp(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_mariage uuid;
  v_content jsonb;
  v_deadline date;
  v_max int;
  v_invite uuid;
  v_nb int := coalesce((p->>'nb_personnes')::int, 0);
  v_id uuid;
begin
  -- Mariage visé (slug envoyé par le site) ; à défaut, le seul mariage existant (ancienne version du site)
  select id, content into v_mariage, v_content from mariages where slug = lower(coalesce(p->>'mariage', ''));
  if v_mariage is null and (select count(*) from mariages) = 1 then
    select id, content into v_mariage, v_content from mariages limit 1;
  end if;
  if v_mariage is null then
    raise exception 'Mariage introuvable.';
  end if;

  v_deadline := nullif(v_content #>> '{rsvp,dateLimite}', '')::date;
  if v_deadline is not null and current_date > v_deadline then
    raise exception 'La date limite de réponse est dépassée.';
  end if;

  v_max := coalesce((v_content #>> '{rsvp,maxParDefaut}')::int, 2);
  if p ? 'invite_id' and nullif(p->>'invite_id', '') is not null then
    select id, max_personnes into v_invite, v_max from invites
    where id = (p->>'invite_id')::uuid and mariage_id = v_mariage;   -- l'invité doit appartenir à ce mariage
  end if;

  if (p->>'present')::boolean and (v_nb < 1 or v_nb > v_max) then
    raise exception 'Nombre de personnes invalide (maximum %).', v_max;
  end if;
  if length(coalesce(p->>'nom', '')) < 2 then
    raise exception 'Merci d''indiquer votre nom.';
  end if;

  insert into rsvps (mariage_id, invite_id, nom, email, telephone, present, nb_personnes, accompagnants,
                     enfants, regime, moments, chanson, message, reponses)
  values (
    v_mariage,
    v_invite,
    left(p->>'nom', 120),
    left(p->>'email', 160),
    left(p->>'telephone', 40),
    (p->>'present')::boolean,
    case when (p->>'present')::boolean then v_nb else 0 end,
    left(p->>'accompagnants', 400),
    greatest(0, least(20, coalesce((p->>'enfants')::int, 0))),
    left(p->>'regime', 300),
    coalesce(array(select jsonb_array_elements_text(p->'moments')), '{}'),
    left(p->>'chanson', 200),
    left(p->>'message', 1500),
    case when jsonb_typeof(p->'reponses') = 'array' and jsonb_array_length(p->'reponses') <= 30
              and length((p->'reponses')::text) <= 8000
         then p->'reponses' else '[]'::jsonb end
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.get_invite(text, text) to anon, authenticated;
grant execute on function public.submit_rsvp(jsonb) to anon, authenticated;

-- Ancienne fonction (site à un seul couple) : retirée, remplacée par get_invite(mariage, slug)
drop function if exists public.get_invite(text);

-- ---------- Stockage des photos ----------
-- Chaque mariage a son dossier : photos/<id du mariage>/<fichier>
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos lecture publique" on storage.objects;
create policy "photos lecture publique" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos admin ajout" on storage.objects;
drop policy if exists "photos ajout proprietaire" on storage.objects;
create policy "photos ajout proprietaire" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] in (select id::text from public.mariages where owner_id = auth.uid()));
drop policy if exists "photos admin suppression" on storage.objects;
drop policy if exists "photos suppression proprietaire" on storage.objects;
create policy "photos suppression proprietaire" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] in (select id::text from public.mariages where owner_id = auth.uid()));

-- ============================================================
--  Ajouter un nouveau couple (après avoir créé son compte dans Authentication > Users) :
--
--  insert into public.mariages (slug, owner_id, content)
--  values ('prenom-prenom', (select id from auth.users where email = 'email@des-maries.fr'), '{}'::jsonb);
--
--  Le contenu vide est complété par les valeurs par défaut du template ; les mariés remplissent ensuite tout depuis /admin.
-- ============================================================
