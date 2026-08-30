# Backend Contract for the Future Account Frontend

## Scope and boundary

This is the server-service contract for the future authenticated frontend. No account HTTP API or account UI exists yet. A future route handler, server action or server component must resolve the authenticated account server-side and call these services; browser code must not import repositories, Drizzle, `StorageService`, or privileged Supabase clients.

All identifiers are UUID strings. Every mutation accepts an authenticated internal `actorUserId`; the application derives it from Supabase through `AccountService.resolveCurrentAccount()` rather than taking it from browser input.

## Account bootstrap

`AccountService.resolveCurrentAccount()`:

```text
Supabase claims -> users upsert by provider identity -> active Personal workspace -> owner membership
```

This is idempotent and protected by an active `(owner_user_id, name)` uniqueness constraint. The returned shape is `{ user, workspace }`. A missing session produces `UNAUTHENTICATED`; absent public Supabase configuration produces `CONFIGURATION_ERROR`. The current anonymous/local input flow remains independent until the UI explicitly offers an opt-in import.

## Common contracts

### Pagination

History, scenarios, files and activity use:

```ts
type PageRequest = { cursor?: string; limit: number };
type PageResult<T> = { items: T[]; nextCursor: string | null };
```

`limit` is an integer from 1 through 100. Results sort by `createdAt` descending and then UUID descending; `nextCursor` is opaque. Pass it unchanged as the next request cursor. Workspace, company, dataset, analysis, scenario, file and activity collections all use this contract.

### Errors

Services throw `AppError` with a stable `code` and safe message. A route adapter should map codes to appropriate HTTP responses without passing stacks or provider/database details to the client:

| Code | Meaning |
| --- | --- |
| `UNAUTHENTICATED` | No valid authenticated identity |
| `FORBIDDEN` | Membership or role does not permit the action |
| `NOT_FOUND` | Entity is absent from the requested tenant scope |
| `VALIDATION_ERROR` | Request or persisted payload failed validation |
| `CONFLICT` | Safe idempotency or concurrent-version collision |
| `ANALYSIS_FAILED` | Analysis failed without a partial result |
| `STORAGE_ERROR` | Private object operation could not complete |
| `CONFIGURATION_ERROR` | Required server provider configuration is absent |

`NOT_FOUND` is intentionally returned for a missing resource inside an authorized workspace; membership checks run first, so a foreign workspace request remains `FORBIDDEN`.

### Authorization

Every method below accepts `actorUserId` and `workspaceId` before entity identifiers. Do not trust a workspace or company ID carried in a URL alone. The definitive role matrix is in [accounts-and-persistence-architecture.md](accounts-and-persistence-architecture.md).

## Service capabilities

| Domain | Server service methods | Notes |
| --- | --- | --- |
| Account | `AccountService.resolveCurrentAccount()` | Maps session and ensures one personal workspace. |
| Workspaces | `WorkspaceService.listForUser`, `createPersonalWorkspace`, `ensurePersonalWorkspace`, `addMember`, `archive` | Archive is owner-only. `createPersonalWorkspace` is for deliberate workspace creation; bootstrap uses `ensurePersonalWorkspace`. |
| Companies | `CompanyService.list`, `get`, `create`, `update`, `archive` | Canonical fields are name, industry and EUR/USD/GBP currency. Archive preserves historical lineage. |
| Financial datasets | `FinancialDatasetService.list`, `getVersion`, `createDataset`, `createVersion`, `archive` | Input is revalidated canonical financial input. Editing creates a new immutable version; no version-update/delete method exists. |
| Analysis history | `AnalysisHistoryService.execute`, `get`, `list` | Execution is tied to a company and immutable dataset version; optional idempotency key is scoped to workspace. |
| Scenarios | `ScenarioService.get`, `list`, `create`, `update`, `archive` | Update only changes scenario name/description. Assumptions/results are immutable lineage records. |
| Files | `FileService.upload`, `list`, `getSignedUrl`, `delete` | Browser uploads must go through an authorized server endpoint; signed URLs are short-lived. |
| Activity | `ActivityService.list` | Product events only, no Auth/security-log replacement. |

## Request notes

- `CompanyService.create/update` validate `name`, `industry`, and supported `currency` using server schemas.
- `FinancialDatasetService.createDataset/createVersion` accepts a canonical `FinancialAnalysisInput` candidate; it binds the company ID server-side and runs `parseFinancialAnalysisInput()`.
- `AnalysisHistoryService.execute` requires `companyId`, `datasetVersionId`, and optional safe `idempotencyKey`. It returns `{ runId, result }`; `get` returns the stored run plus parsed result or `null` for a failed/incomplete run.
- `ScenarioService.create` requires `baseAnalysisRunId`, `sourceDatasetVersionId`, `name`, optional `description`, and a complete `ScenarioAssumptions` object. The base run must be completed and match the same company/dataset version.
- `FileService.upload` accepts original filename, MIME type, category, optional company ID, and bytes. The allow-list is PDF, CSV and XLSX, maximum 20 MiB. It never accepts a caller-chosen storage key.

## File access and privacy

Files are metadata in PostgreSQL and bytes in a private bucket. The frontend must request a signed URL after the server has checked workspace membership. It must never construct a storage path or use the Supabase service role key. Deleted files no longer resolve through the service, even if a provider cleanup needs operational follow-up.

## Anonymous-to-account import contract

When account UI is approved, local browser data must be imported only through an explicit user action:

```text
validate local canonical input
  -> resolve authenticated account/workspace
  -> create company and immutable dataset version
  -> execute a fresh persisted analysis
  -> show success before offering to clear local draft/session data
```

Do not automatically create duplicate companies or move local data without confirmation. Browser drafts and session handoff remain non-canonical until this flow completes.

## Provider prerequisites

Deployers must configure `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` in server-safe environment configuration. The validated deployment uses a Supabase Session Pooler URL for database connectivity, Drizzle migrations for application tables, and a private bucket accessed only through server services. See [integration-readiness-review.md](integration-readiness-review.md) for the live integration evidence and server-mediated RLS decision.
