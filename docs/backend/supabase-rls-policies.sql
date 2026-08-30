-- Optional defense in depth for a provisioned Supabase project.
-- Do not run through the application's generic PostgreSQL migration chain:
-- auth.uid() is a Supabase-specific function and the production database role
-- must be reviewed before enabling RLS.

create or replace function public.current_application_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_provider = 'supabase'
    and auth_provider_user_id = auth.uid()::text
  limit 1;
$$;

create or replace function public.can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = public.current_application_user_id()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.companies enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.files enable row level security;
alter table public.activity_events enable row level security;

create policy workspaces_member_access on public.workspaces
  for all using (public.can_access_workspace(id))
  with check (public.can_access_workspace(id));
create policy workspace_members_member_access on public.workspace_members
  for all using (public.can_access_workspace(workspace_id))
  with check (public.can_access_workspace(workspace_id));
create policy companies_member_access on public.companies
  for all using (public.can_access_workspace(workspace_id))
  with check (public.can_access_workspace(workspace_id));
create policy analysis_runs_member_access on public.analysis_runs
  for all using (public.can_access_workspace(workspace_id))
  with check (public.can_access_workspace(workspace_id));
create policy files_member_access on public.files
  for all using (public.can_access_workspace(workspace_id))
  with check (public.can_access_workspace(workspace_id));
create policy activity_events_member_access on public.activity_events
  for all using (public.can_access_workspace(workspace_id))
  with check (public.can_access_workspace(workspace_id));

-- Apply equivalent policies to dataset, result and scenario tables through
-- their company/workspace lineage before exposing direct Supabase client access.
