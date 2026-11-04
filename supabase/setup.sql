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
  select private.is_member() and case split_part(p, '/', 1)
    when 'config'  then private.is_admin()
    when 'members' then private.is_admin() or split_part(p, '/', 2) = auth.uid()::text
    when 'votes'   then private.is_admin() or split_part(p, '/', 2) = auth.uid()::text
    else true
  end;
$$;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.can_write(text) from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_write(text) to authenticated;

drop policy if exists "lecture" on public.docs;
create policy "lecture" on public.docs for select to authenticated using (private.is_member());
drop policy if exists "ajout" on public.docs;
-- Un commentaire ne peut être écrit qu'au nom de la personne connectée.
create policy "ajout" on public.docs for insert to authenticated
  with check (private.can_write(path) and collection = split_part(path, '/', 1)
    and (collection <> 'comments' or data->>'by' = auth.uid()::text));
drop policy if exists "modification" on public.docs;
create policy "modification" on public.docs for update to authenticated
  using (private.can_write(path) and (collection <> 'comments' or data->>'by' = auth.uid()::text))
  with check (private.can_write(path) and collection = split_part(path, '/', 1)
    and (collection <> 'comments' or data->>'by' = auth.uid()::text));
drop policy if exists "suppression" on public.docs;
-- Suppression : un logement par un organisateur seulement, un commentaire par son auteur ou un organisateur.
create policy "suppression" on public.docs for delete to authenticated using (
  private.can_write(path) and case collection
    when 'listings' then private.is_admin()
    when 'comments' then private.is_admin() or data->>'by' = auth.uid()::text
    else true
  end
);

drop policy if exists "lecture admins" on public.admins;
create policy "lecture admins" on public.admins for select to authenticated using (true);

-- 4. Mises à jour en direct (quand quelqu'un vote, tout le monde le voit)
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- 5. Les photos des logements
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;
-- 5 Mo maximum, images seulement
update storage.buckets set file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
where id = 'photos';
drop policy if exists "photos ajout" on storage.objects;
create policy "photos ajout" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and private.is_member());
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

-- Connexion Google + liste blanche : toute personne qui se connecte arrive « en attente » ;
-- un organisateur la valide depuis Réglages > Demandes d'accès (ou en ajoutant son id dans public.approved).
create table if not exists public.approved (user_id uuid primary key references auth.users on delete cascade);
create table if not exists public.pending (
  user_id uuid primary key references auth.users on delete cascade,
  email text, name text, created_at timestamptz not null default now());
alter table public.approved enable row level security;
alter table public.pending  enable row level security;
insert into public.approved (user_id) select id from auth.users on conflict do nothing;

create or replace function private.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
      or exists (select 1 from public.approved where user_id = auth.uid());
$$;
revoke all on function private.is_member() from public, anon;
grant execute on function private.is_member() to authenticated;

drop policy if exists "lecture approved" on public.approved;
create policy "lecture approved" on public.approved for select to authenticated using (user_id = auth.uid() or private.is_admin());
drop policy if exists "lecture pending" on public.pending;
create policy "lecture pending" on public.pending for select to authenticated using (user_id = auth.uid() or private.is_admin());

create or replace function public.register_pending() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.pending (user_id, email, name)
  values (new.id, new.email,
    coalesce(new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict do nothing;
  return new;
end $$;
revoke all on function public.register_pending() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.register_pending();

-- Valider / refuser (appelée par l'app ; vérifie elle-même que l'appelant est organisateur)
create or replace function public.approve_user(uid uuid, ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not private.is_admin() then raise exception 'organisateur requis'; end if;
  if ok then insert into public.approved (user_id) values (uid) on conflict do nothing; end if;
  delete from public.pending where user_id = uid;
end $$;
revoke all on function public.approve_user(uuid, boolean) from public, anon;
grant execute on function public.approve_user(uuid, boolean) to authenticated;

-- Fusion côté serveur (utilisée par l'app pour modifier quelques champs d'une fiche) :
-- deux personnes qui modifient la même fiche en même temps ne s'écrasent plus. security invoker : les règles ci-dessus s'appliquent.
create or replace function public.patch_doc(p text, patch jsonb) returns jsonb
language sql security invoker set search_path = public as $$
  update public.docs set data = data || patch, updated_by = auth.uid(), updated_at = now()
  where path = p returning data;
$$;
revoke all on function public.patch_doc(text, jsonb) from public, anon;
grant execute on function public.patch_doc(text, jsonb) to authenticated;
