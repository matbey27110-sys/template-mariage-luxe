-- ============================================================
--  Template mariage luxe — schéma Supabase
--  À coller une fois dans : Supabase > SQL Editor > New query > Run
-- ============================================================

-- Contenu du site (une seule ligne, id = 1)
create table if not exists public.site (
  id int primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site (id) values (1) on conflict do nothing;

-- Invités (lien personnalisé : https://site.fr/?invite=<slug>)
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nom text not null,
  max_personnes int not null default 1 check (max_personnes between 1 and 20),
  created_at timestamptz not null default now()
);

-- Réponses RSVP
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

-- ---------- Sécurité (RLS) ----------
alter table public.site    enable row level security;
alter table public.invites enable row level security;
alter table public.rsvps   enable row level security;

-- Tout le monde peut lire le contenu, seuls les mariés connectés le modifient
drop policy if exists "site lecture publique" on public.site;
create policy "site lecture publique" on public.site for select using (true);
drop policy if exists "site admin" on public.site;
create policy "site admin" on public.site for update to authenticated using (true) with check (true);

-- Invités et réponses : réservés aux mariés connectés
drop policy if exists "invites admin" on public.invites;
create policy "invites admin" on public.invites for all to authenticated using (true) with check (true);
drop policy if exists "rsvps admin" on public.rsvps;
create policy "rsvps admin" on public.rsvps for all to authenticated using (true) with check (true);

-- ---------- Fonctions publiques ----------
-- Retrouver un invité à partir de son lien (sans exposer la liste complète)
create or replace function public.get_invite(p_slug text)
returns table (id uuid, nom text, max_personnes int)
language sql security definer set search_path = public as $$
  select id, nom, max_personnes from invites where slug = lower(p_slug) limit 1;
$$;

-- Envoyer une réponse : vérifie la date limite et le nombre max de personnes
create or replace function public.submit_rsvp(p jsonb)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_content jsonb;
  v_deadline date;
  v_max int;
  v_invite uuid;
  v_nb int := coalesce((p->>'nb_personnes')::int, 0);
  v_id uuid;
begin
  select content into v_content from site where id = 1;
  v_deadline := nullif(v_content #>> '{rsvp,dateLimite}', '')::date;
  if v_deadline is not null and current_date > v_deadline then
    raise exception 'La date limite de réponse est dépassée.';
  end if;

  v_max := coalesce((v_content #>> '{rsvp,maxParDefaut}')::int, 2);
  if p ? 'invite_id' and nullif(p->>'invite_id', '') is not null then
    select id, max_personnes into v_invite, v_max from invites where id = (p->>'invite_id')::uuid;
  end if;

  if (p->>'present')::boolean and (v_nb < 1 or v_nb > v_max) then
    raise exception 'Nombre de personnes invalide (maximum %).', v_max;
  end if;
  if length(coalesce(p->>'nom', '')) < 2 then
    raise exception 'Merci d''indiquer votre nom.';
  end if;

  insert into rsvps (invite_id, nom, email, telephone, present, nb_personnes, accompagnants,
                     enfants, regime, moments, chanson, message)
  values (
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
    left(p->>'message', 1500)
  )
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.get_invite(text) to anon, authenticated;
grant execute on function public.submit_rsvp(jsonb) to anon, authenticated;

-- ---------- Stockage des photos ----------
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos lecture publique" on storage.objects;
create policy "photos lecture publique" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "photos admin ajout" on storage.objects;
create policy "photos admin ajout" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
drop policy if exists "photos admin suppression" on storage.objects;
create policy "photos admin suppression" on storage.objects for delete to authenticated using (bucket_id = 'photos');
