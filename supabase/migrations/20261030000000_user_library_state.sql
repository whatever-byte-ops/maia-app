create table if not exists public.user_library_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_library_state enable row level security;

revoke all on public.user_library_state from anon;
grant select, insert, update, delete on public.user_library_state to authenticated;

create policy "Users can read their own library state"
  on public.user_library_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own library state"
  on public.user_library_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own library state"
  on public.user_library_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own library state"
  on public.user_library_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
