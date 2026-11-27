-- Celo wallet login demo: notes that only their owner can see, and only after signing in on Celo.
-- Same policy as https://docs.celo.org/build/sign-in-with-celo-wallet#accept-only-celo

create schema if not exists private;

-- true when the user's latest Web3 sign-in was on Celo mainnet (42220).
-- Reads auth.identities, which only Supabase Auth writes. Never use user_metadata here:
-- users can change it with supabase.auth.updateUser({ data }).
create function private.signed_in_on_celo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.identities i
    where i.user_id = (select auth.uid())
      and i.provider = 'web3'
      and i.identity_data -> 'custom_claims' ->> 'network' = '42220'
  );
$$;

revoke all on function private.signed_in_on_celo() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.signed_in_on_celo() to authenticated;

create table public.notes (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;
revoke all on public.notes from anon;
grant select, insert, delete on public.notes to authenticated;

create policy "read own notes on celo" on public.notes
  for select to authenticated
  using (user_id = (select auth.uid()) and (select private.signed_in_on_celo()));

create policy "add own notes on celo" on public.notes
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.signed_in_on_celo()));

create policy "delete own notes on celo" on public.notes
  for delete to authenticated
  using (user_id = (select auth.uid()) and (select private.signed_in_on_celo()));
