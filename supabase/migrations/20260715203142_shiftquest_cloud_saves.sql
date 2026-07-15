create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.game_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1 check (schema_version >= 1),
  revision integer not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_saves_state_is_object check (jsonb_typeof(state) = 'object')
);

comment on table public.game_saves is
  'One versioned ShiftQuest game-state document per authenticated user. Provider API keys are never stored here.';

alter table public.game_saves enable row level security;

revoke all on table public.game_saves from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on table public.game_saves to authenticated;
grant insert (user_id, state, schema_version) on table public.game_saves to authenticated;
grant update (state, schema_version) on table public.game_saves to authenticated;
grant delete on table public.game_saves to authenticated;
grant all on table public.game_saves to service_role;

create policy "Users can read their own game save"
  on public.game_saves
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own game save"
  on public.game_saves
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own game save"
  on public.game_saves
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own game save"
  on public.game_saves
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create function private.bump_game_save_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if tg_op = 'UPDATE' then
    new.revision = old.revision + 1;
  end if;
  return new;
end;
$$;

revoke all on function private.bump_game_save_revision() from public, anon, authenticated;

create trigger game_saves_revision_trigger
before insert or update on public.game_saves
for each row execute function private.bump_game_save_revision();
