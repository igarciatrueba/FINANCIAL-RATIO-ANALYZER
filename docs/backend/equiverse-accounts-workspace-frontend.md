# EQUIVERSE Accounts and Persistent Workspace Frontend

## Product modes

EQUIVERSE intentionally supports two modes. Anonymous visitors can use Financial Input, analysis, ratios, DuPont and Scenario Lab with local browser storage. Authenticated users can additionally save an accepted canonical input to a personal workspace and return to its immutable history.

```text
Anonymous financial input -> session analysis -> optional sign in -> explicit save
Authenticated financial input -> company -> immutable dataset version -> analysis run -> stored result
```

Local data is not silently imported and is never treated as a database record before the server confirms the save.

## Authentication and session boundary

`src/features/accounts/auth-session-provider.tsx` is the browser session boundary. It distinguishes loading, anonymous, authenticated, expired and unavailable configuration states through Supabase Auth's publishable browser client. It never reads a service-role key.

The pages `/login`, `/signup`, `/forgot-password` and `/reset-password` use that client only for Auth actions. Provider errors are mapped to product-safe text. The server is still authoritative: `/workspace` and `/account` call `AccountService.resolveCurrentAccount()`, which maps the verified Supabase identity to an internal user and personal workspace. Unauthenticated protected requests redirect to `/login` with a safe return path.

## Workspace surfaces

The workspace uses server components with `dynamic = "force-dynamic"` so one account cannot receive another account's response.

| Route | Purpose | Server capability |
| --- | --- | --- |
| `/workspace` | Recent work, factual counts and activity | Company, analysis, scenario, file and activity lists |
| `/workspace/companies` | Create, edit and archive companies | `CompanyService` |
| `/workspace/history` | Cursor-paginated immutable analyses | `AnalysisHistoryService` |
| `/workspace/analyses/[runId]` | Reopen stored result from its exact dataset version | Analysis and dataset read services |
| `/workspace/files` | Private upload, list, signed open and delete | `FileService` |
| `/workspace/scenarios` | Cursor-paginated scenario library | `ScenarioService` |
| `/workspace/scenarios/[scenarioId]` | Reopen stored scenario result and lineage | Scenario and dataset read services |
| `/account` | Email identity, workspace name and password-reset path | Account session context |

List paging passes the opaque backend cursor unchanged through the route query string. Company data is archived rather than hard-deleted, preserving historical references.

## Persistence actions

`src/app/workspace/actions.ts` is the project-owned server action boundary. It resolves the actor and active workspace before every mutation. Financial-input persistence validates the canonical `FinancialAnalysisInput`, finds or creates the workspace company, creates a new immutable dataset version, executes the analysis through `AnalysisHistoryService`, and returns the persisted run ID only after completion. A historical page reads the stored result and the specific dataset version instead of recalculating from current data.

Scenario saving requires the selected persisted analysis lineage and delegates to `ScenarioService`. Private file bytes reach `SupabaseStorageService` only through `FileService` on the server; the browser asks a server action for a short-lived signed URL and never sees an object key or service role.

## Authorization and safety

All tenant access remains backend-enforced:

```text
Supabase session -> internal user -> workspace membership -> role action -> workspace-scoped resource
```

The UI may hide unavailable actions, but it is not the authorization layer. No frontend component queries Supabase tables directly, imports Drizzle, or accepts a caller-provided workspace identity. See [frontend-integration-contract.md](frontend-integration-contract.md) and [accounts-and-persistence-architecture.md](accounts-and-persistence-architecture.md) for service and role details.

## Testing and manual checks

Frontend tests cover account-safe error mapping, local persisted-context recovery, anonymous navigation, authentication labels and workspace navigation. Backend tests cover company lifecycle, tenant isolation, immutable dataset versions, analysis and scenario persistence, private file access and roles. Before release, run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run db:test`, `npm run build`, `npm run db:check`, and the intentionally configured synthetic `npm run db:live:check` where appropriate.
