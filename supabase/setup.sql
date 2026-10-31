-- Notre gîte d'été : installation de la base Supabase.
-- Déjà installé sur le projet notre-gite. Pour une nouvelle base : Supabase > SQL Editor > New query, coller, « Run ».

-- 1. Les données du carnet : un document JSON par élément (logement, vote, commentaire…)
create table if not exists public.docs (
  path        text primary key,            -- ex. listings/ab12…, votes/<id de la personne>
  collection  text not null,               -- ex. listings, votes, members, comments, config, trip
  data        jsonb not null default '{}'::jsonb,
  updated_by  uuid default auth.uid(),
  updated_at  timestamptz not null default now()
);
create index if not exists docs_collection_idx on public.docs (collection);

-- 2. Les organisateurs (peuvent supprimer des logements, modifier les critères, clore les votes)
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- 3. Règles d'accès : seules les personnes connectées lisent et écrivent
alter table public.docs   enable row level security;
alter table public.admins enable row level security;

-- Fonctions de contrôle rangées dans un schéma privé (non exposé sur Internet)
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Qui peut écrire quoi :
--   config/…                 : organisateurs seulement
--   members/<id>, votes/<id> : la personne elle-même (ou un organisateur)
--   le reste (logements, commentaires, voyage) : toute personne connectée
create or replace function private.can_write(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select case split_part(p, '/', 1)
    when 'config'  then private.is_admin()
    when 'members' then private.is_admin() or split_part(p, '/', 2) = auth.uid()::text
    when 'votes'   then private.is_admin() or split_part(p, '/', 2) = auth.uid()::text
    else auth.uid() is not null
  end;
$$;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.can_write(text) from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_write(text) to authenticated;

drop policy if exists "lecture" on public.docs;
create policy "lecture" on public.docs for select to authenticated using (true);
drop policy if exists "ajout" on public.docs;
create policy "ajout" on public.docs for insert to authenticated
  with check (private.can_write(path) and collection = split_part(path, '/', 1));
drop policy if exists "modification" on public.docs;
create policy "modification" on public.docs for update to authenticated
  using (private.can_write(path)) with check (private.can_write(path) and collection = split_part(path, '/', 1));
drop policy if exists "suppression" on public.docs;
create policy "suppression" on public.docs for delete to authenticated using (private.can_write(path));

drop policy if exists "lecture admins" on public.admins;
create policy "lecture admins" on public.admins for select to authenticated using (true);

-- 4. Mises à jour en direct (quand quelqu'un vote, tout le monde le voit)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 5. Les photos des logements
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;
drop policy if exists "photos ajout" on storage.objects;
create policy "photos ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos');
drop policy if exists "photos suppression" on storage.objects;
create policy "photos suppression" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (owner = auth.uid() or private.is_admin()));

-- 6. Réglages de départ du carnet
insert into public.docs (path, collection, data) values
('config/main', 'config', '{
  "title": "Notre gîte d''été",
  "criteria": [
    {"id": "prix", "label": "Prix"},
    {"id": "lieu", "label": "Localisation"},
    {"id": "confort", "label": "Confort et équipements"},
    {"id": "ambiance", "label": "Photos et ambiance"},
    {"id": "couchages", "label": "Couchages"},
    {"id": "activites", "label": "Activités autour"}
  ],
  "statuses": [
    {"id": "propose", "label": "Proposé"},
    {"id": "discussion", "label": "En discussion"},
    {"id": "preselection", "label": "Présélectionné"},
    {"id": "reserve", "label": "Réservé"}
  ],
  "perms": {"deleteListing": "owner", "editCriteria": "owner", "closeVotes": "owner", "changeStatus": "all"},
  "closed": false, "closedAt": null
}'::jsonb),
('trip/main', 'trip', '{"destination": "France", "periode": "Été, dates à définir", "budget": ""}'::jsonb)
on conflict (path) do nothing;

-- Quand une personne est supprimée de Authentication > Users, sa fiche « inscrit » et ses votes disparaissent aussi.
create or replace function public.cleanup_deleted_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from public.docs where path in ('members/' || old.id::text, 'votes/' || old.id::text);
  return old;
end $$;
revoke all on function public.cleanup_deleted_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted after delete on auth.users
  for each row execute function public.cleanup_deleted_user();
