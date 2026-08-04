create schema if not exists private;

create table public.social_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  industry text not null,
  professional_role text not null,
  career_level text not null,
  profile_visibility text not null default 'private',
  leaderboard_opt_in boolean not null default false,
  achievement_count_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_profiles_display_name_length
    check (char_length(display_name) between 2 and 60),
  constraint social_profiles_industry_length
    check (char_length(industry) between 2 and 80),
  constraint social_profiles_professional_role_length
    check (char_length(professional_role) between 2 and 80),
  constraint social_profiles_career_level
    check (career_level in ('student', 'entry', 'mid', 'senior', 'lead', 'manager', 'executive')),
  constraint social_profiles_visibility
    check (profile_visibility in ('private', 'friends'))
);

comment on table public.social_profiles is
  'Opt-in social identity. It deliberately contains no email, learning-route careerArea, or game title.';

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint friendships_canonical_order check (user_a < user_b),
  constraint friendships_unique_pair unique (user_a, user_b)
);

create index friendships_user_b_idx
  on public.friendships (user_b);

create table public.social_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint social_blocks_not_self check (blocker_id <> blocked_id)
);

create index social_blocks_blocked_blocker_idx
  on public.social_blocks (blocked_id, blocker_id);

create table public.friend_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint friend_invites_sha256_hex check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint friend_invites_future_expiry check (expires_at > created_at),
  constraint friend_invites_use_state check (
    (used_at is null and accepted_by is null)
    or used_at is not null
  )
);

create index friend_invites_inviter_created_idx
  on public.friend_invites (inviter_id, created_at desc);

create index friend_invites_active_inviter_expires_idx
  on public.friend_invites (inviter_id, expires_at)
  where used_at is null;

create index friend_invites_accepted_by_idx
  on public.friend_invites (accepted_by)
  where accepted_by is not null;

create table public.verified_scenario_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  category text not null,
  accuracy integer not null,
  verified_xp integer not null,
  is_boss boolean not null,
  roleplay_completed boolean not null,
  verified_at timestamptz not null default now(),
  primary key (user_id, scenario_id),
  constraint verified_completion_scenario_id_length
    check (char_length(scenario_id) between 1 and 120),
  constraint verified_completion_category
    check (category in ('office', 'production', 'meeting', 'quality', 'safety', 'career')),
  constraint verified_completion_accuracy check (accuracy between 0 and 100),
  constraint verified_completion_xp check (verified_xp >= 0)
);

comment on table public.verified_scenario_completions is
  'Server-recomputed completion facts. game_saves and browser-local totals are never copied into this table.';

create table public.verified_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  verified_xp integer not null default 0 check (verified_xp >= 0),
  completed_scenarios integer not null default 0 check (completed_scenarios >= 0),
  updated_at timestamptz not null default now()
);

create table public.verified_achievement_counts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  verified_achievement_count integer not null default 0
    check (verified_achievement_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.social_profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.social_blocks enable row level security;
alter table public.friend_invites enable row level security;
alter table public.verified_scenario_completions enable row level security;
alter table public.verified_progress enable row level security;
alter table public.verified_achievement_counts enable row level security;

revoke all on table public.social_profiles from public, anon, authenticated;
revoke all on table public.friendships from public, anon, authenticated;
revoke all on table public.social_blocks from public, anon, authenticated;
revoke all on table public.friend_invites from public, anon, authenticated;
revoke all on table public.verified_scenario_completions from public, anon, authenticated;
revoke all on table public.verified_progress from public, anon, authenticated;
revoke all on table public.verified_achievement_counts from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on table public.social_profiles to authenticated;
grant select on table public.friendships to authenticated;
grant select on table public.social_blocks to authenticated;
grant select on table public.friend_invites to authenticated;
grant select on table public.verified_scenario_completions to authenticated;
grant select on table public.verified_progress to authenticated;
grant select on table public.verified_achievement_counts to authenticated;

grant all on table public.social_profiles to service_role;
grant all on table public.friendships to service_role;
grant all on table public.social_blocks to service_role;
grant all on table public.friend_invites to service_role;
grant all on table public.verified_scenario_completions to service_role;
grant all on table public.verified_progress to service_role;
grant all on table public.verified_achievement_counts to service_role;

create function private.are_unblocked_friends(candidate_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate_user_id = (select auth.uid())
    or (
      (select auth.uid()) is not null
      and exists (
        select 1
        from public.friendships f
        where f.user_a = least((select auth.uid()), candidate_user_id)
          and f.user_b = greatest((select auth.uid()), candidate_user_id)
      )
      and not exists (
        select 1
        from public.social_blocks b
        where (b.blocker_id = (select auth.uid()) and b.blocked_id = candidate_user_id)
           or (b.blocker_id = candidate_user_id and b.blocked_id = (select auth.uid()))
      )
    );
$$;

revoke all on function private.are_unblocked_friends(uuid) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.are_unblocked_friends(uuid) to authenticated;

create policy "Owners and opted-in friends can read social profiles"
  on public.social_profiles
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      profile_visibility = 'friends'
      and (select private.are_unblocked_friends(user_id))
    )
  );

create policy "Participants can read active friendships"
  on public.friendships
  for select
  to authenticated
  using (
    (select auth.uid()) in (user_a, user_b)
    and (select private.are_unblocked_friends(
      case when user_a = (select auth.uid()) then user_b else user_a end
    ))
  );

create policy "Block participants can read block state"
  on public.social_blocks
  for select
  to authenticated
  using ((select auth.uid()) in (blocker_id, blocked_id));

create policy "Inviters can inspect their invite status"
  on public.friend_invites
  for select
  to authenticated
  using (inviter_id = (select auth.uid()));

create policy "Owners can read verified completion detail"
  on public.verified_scenario_completions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Owners and leaderboard friends can read verified progress"
  on public.verified_progress
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      (select private.are_unblocked_friends(user_id))
      and exists (
        select 1
        from public.social_profiles p
        where p.user_id = verified_progress.user_id
          and p.profile_visibility = 'friends'
          and p.leaderboard_opt_in
      )
    )
  );

create policy "Owners and opted-in friends can read achievement totals"
  on public.verified_achievement_counts
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      (select private.are_unblocked_friends(user_id))
      and exists (
        select 1
        from public.social_profiles p
        where p.user_id = verified_achievement_counts.user_id
          and p.profile_visibility = 'friends'
          and p.achievement_count_opt_in
      )
    )
  );

create function private.touch_social_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.touch_social_profile_updated_at() from public, anon, authenticated;

create trigger social_profiles_updated_at_trigger
before update on public.social_profiles
for each row execute function private.touch_social_profile_updated_at();

create function public.accept_friend_invite(
  invite_token_hash text,
  accepting_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_row public.friend_invites%rowtype;
  friendship_id uuid;
begin
  select *
  into invite_row
  from public.friend_invites
  where token_hash = invite_token_hash
  for update;

  if invite_row.id is null
    or invite_row.used_at is not null
    or invite_row.expires_at <= now() then
    raise exception 'invite_invalid_or_expired';
  end if;

  if invite_row.inviter_id = accepting_user_id then
    raise exception 'invite_self_accept_forbidden';
  end if;

  if exists (
    select 1
    from public.social_blocks b
    where (b.blocker_id = invite_row.inviter_id and b.blocked_id = accepting_user_id)
       or (b.blocker_id = accepting_user_id and b.blocked_id = invite_row.inviter_id)
  ) then
    raise exception 'invite_blocked';
  end if;

  insert into public.friendships (user_a, user_b)
  values (
    least(invite_row.inviter_id, accepting_user_id),
    greatest(invite_row.inviter_id, accepting_user_id)
  )
  on conflict (user_a, user_b)
  do update set accepted_at = now()
  returning id into friendship_id;

  update public.friend_invites
  set used_at = now(), accepted_by = accepting_user_id
  where id = invite_row.id;

  return friendship_id;
end;
$$;

revoke all on function public.accept_friend_invite(text, uuid) from public, anon, authenticated;
grant execute on function public.accept_friend_invite(text, uuid) to service_role;

create function public.record_verified_completion(
  completion_user_id uuid,
  completion_scenario_id text,
  completion_category text,
  completion_accuracy integer,
  completion_verified_xp integer,
  completion_is_boss boolean,
  completion_roleplay_completed boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  achievement_total integer;
begin
  insert into public.verified_scenario_completions as existing (
    user_id,
    scenario_id,
    category,
    accuracy,
    verified_xp,
    is_boss,
    roleplay_completed
  )
  values (
    completion_user_id,
    completion_scenario_id,
    completion_category,
    completion_accuracy,
    completion_verified_xp,
    completion_is_boss,
    completion_roleplay_completed
  )
  on conflict (user_id, scenario_id)
  do update set
    category = excluded.category,
    accuracy = greatest(
      existing.accuracy,
      excluded.accuracy
    ),
    verified_xp = greatest(
      existing.verified_xp,
      excluded.verified_xp
    ),
    is_boss = excluded.is_boss,
    roleplay_completed = existing.roleplay_completed
      or excluded.roleplay_completed,
    verified_at = now()
  where excluded.accuracy > existing.accuracy
     or (
       excluded.accuracy = existing.accuracy
       and excluded.verified_xp > existing.verified_xp
     )
     or (
       not existing.roleplay_completed
       and excluded.roleplay_completed
     );

  insert into public.verified_progress (
    user_id,
    verified_xp,
    completed_scenarios,
    updated_at
  )
  select
    completion_user_id,
    coalesce(sum(c.verified_xp), 0)::integer,
    count(*)::integer,
    now()
  from public.verified_scenario_completions c
  where c.user_id = completion_user_id
  on conflict (user_id)
  do update set
    verified_xp = excluded.verified_xp,
    completed_scenarios = excluded.completed_scenarios,
    updated_at = excluded.updated_at;

  select
    (case when count(*) >= 1 then 1 else 0 end)
    + (case when max(accuracy) >= 90 then 1 else 0 end)
    + (case when count(*) filter (where category = 'meeting') >= 2 then 1 else 0 end)
    + (case when count(*) filter (where category = 'safety') >= 2 then 1 else 0 end)
    + (case when count(*) filter (where category = 'production') >= 2 then 1 else 0 end)
    + (case when count(*) filter (where category = 'quality') >= 2 then 1 else 0 end)
    + (case when bool_or(roleplay_completed) then 1 else 0 end)
    + (case when count(*) filter (where is_boss) >= 6 then 1 else 0 end)
    + (case when max(accuracy) = 100 then 1 else 0 end)
  into achievement_total
  from public.verified_scenario_completions
  where user_id = completion_user_id;

  insert into public.verified_achievement_counts (
    user_id,
    verified_achievement_count,
    updated_at
  )
  values (completion_user_id, coalesce(achievement_total, 0), now())
  on conflict (user_id)
  do update set
    verified_achievement_count = excluded.verified_achievement_count,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.record_verified_completion(
  uuid, text, text, integer, integer, boolean, boolean
) from public, anon, authenticated;
grant execute on function public.record_verified_completion(
  uuid, text, text, integer, integer, boolean, boolean
) to service_role;
