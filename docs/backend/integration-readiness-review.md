# Backend Integration Readiness Review

**Review date:** 2026-08-22
**Branch reviewed:** `codex/accounts-persistence-backend`
**Scope:** account/workspace persistence backend only. The anonymous product and financial methodology are unchanged.

## Verdict

The backend is **validated against the configured real Supabase environment and ready for the future account frontend boundary**. Drizzle migrations were applied through the configured Session Pooler; the application schema was inspected; and isolated synthetic Auth, database and Storage workflows passed and were cleaned up.

No provider credential, project identifier, connection string, synthetic password or test fixture was written to the repository or retained after validation.

## Implementation inventory

| Area | Implemented location |
| --- | --- |
| Drizzle schema | `src/server/db/schema.ts` |
| Application SQL migrations | `drizzle/0000_awesome_smasher.sql`, `drizzle/0001_busy_nextwave.sql` |
| Database client and connection check | `src/server/db/client.ts`, `src/server/db/check-connection.ts` |
| Migration and development seed | `src/server/db/run-migrations.ts`, `src/server/db/migrations.ts`, `src/server/db/seed*.ts` |
| Repository | `src/server/repositories/backend-repository.ts` |
| Authentication boundary | `src/server/auth/require-authenticated-user.ts`, `src/server/auth/supabase-server.ts`, `src/server/auth/supabase-proxy.ts`, `src/proxy.ts` |
| Authorization | `src/server/authorization.ts`, `src/server/services/authorization-service.ts` |
| Storage interface and provider adapter | `src/server/storage/types.ts`, `src/server/storage/supabase-storage-service.ts` |
| Account, workspace, company, dataset, analysis, scenario, file and activity services | `src/server/services/` |
| Live integration command | `src/server/db/live-integration-check.ts`, run by `npm run db:live:check` |
| Current HTTP endpoint | `src/app/api/health/route.ts` only |
| Backend tests | `src/test/backend-*.test.ts` |
| Architecture / decision records | this document, `accounts-and-persistence-architecture.md`, `frontend-integration-contract.md`, `docs/decisions/ADR-003-accounts-and-persistence-architecture.md` |
| Environment names only | `.env.example` |

There are deliberately no account HTTP routes, server actions, login pages, workspace screens, history screens or file-management screens yet. The server service boundary is the contract for that later UI phase.

## Actual data model

The application tables are `users`, `workspaces`, `workspace_members`, `companies`, `financial_datasets`, `financial_dataset_versions`, `financial_statements`, `financial_statement_values`, `analysis_runs`, `analysis_results`, `scenarios`, `scenario_assumptions`, `scenario_results`, `files`, and `activity_events`.

- UUID application identifiers are primary keys. References use explicit `RESTRICT`, `CASCADE`, or `SET NULL` delete actions appropriate to lineage.
- `workspace_members` is unique by `(workspace_id, user_id)`; its PostgreSQL enum limits roles to owner, admin, member and viewer.
- `users` has unique provider identity `(auth_provider, auth_provider_user_id)` and unique normalized email. It has no password-equivalent column.
- Active personal-workspace provisioning is protected by the partial unique index `(owner_user_id, name) WHERE archived_at IS NULL` in migration `0001_busy_nextwave.sql`.
- Dataset versions are unique by `(financial_dataset_id, version_number)` and are only inserted. Canonical input and analytical snapshots are JSONB at validated versioned boundaries.
- Normalized statement values use `numeric(20,6)`, mapped into TypeScript as decimal strings for persistence; domain parsing retains the existing canonical numeric rules.
- Analysis runs retain workspace, company, immutable dataset version, requester, engine version, input schema version, lifecycle timestamps, safe failure code and optional idempotency key. Results retain an independently versioned snapshot envelope.
- Companies, workspaces, datasets and scenarios are archived. Files are soft-deleted. Analyses, versions and activity events are not removed by normal services.

The complete ERD and table-by-table data dictionary remain in [accounts-and-persistence-architecture.md](accounts-and-persistence-architecture.md).

## Review findings and local fixes

| Finding | Risk | Resolution |
| --- | --- | --- |
| Internal-user provisioning used a read-then-write path. | A first-login retry could race. | User mapping uses conflict-tolerant insertion, then retrieves by provider identity; a same-email/different-identity collision returns typed `CONFLICT`. Live concurrent bootstrap now creates one user and one personal workspace. |
| Personal workspace bootstrap used a read-then-create path. | Duplicate active personal workspaces or raw uniqueness failures. | Added the active-owner/name unique index and transactional insert-or-read bootstrap. Concurrent retries return one workspace and one owner membership. |
| Dataset-version and analysis-idempotency uniqueness could surface raw database conflicts. | A retry could expose an implementation detail or create partial work. | Conflict-safe inserts return typed `CONFLICT` errors; dataset statements are inside the surrounding transaction. |
| Future account frontend lacked several tenant-scoped read/archive/update service boundaries. | UI would need repository access or invent unsafe paths. | Added workspace list/archive; company list/get/update; dataset list/get-version/archive; scenario get/list/update/archive; file list/delete; cursor pagination for scenarios, files and activity. |
| Scenario recovery did not revalidate persisted assumption JSONB at the read boundary. | A malformed stored payload could be trusted. | Scenario reads now parse the complete assumption contract and result snapshot, returning a safe validation error on malformed persisted data. |
| Cursor pagination used the item beyond the current page as its cursor. | The first record of the next page could be skipped. | All paginated repository lists now use the last returned item as the cursor; PGlite and live checks cover page continuation. |

## Authorization and IDOR review

All account-owned operations pass through the same sequence:

```text
authenticated provider identity
  -> internal users row
  -> workspace_members lookup
  -> role action check
  -> workspace-scoped entity lookup or mutation
```

`AuthorizationService` validates identifiers, resolves membership first, and constrains company, dataset version, analysis run, scenario and file repository queries by workspace. There are no unrestricted `getCompany`, `getAnalysis`, `getScenario` or `getFile` service methods. PGlite tests cover foreign-workspace denial, viewer mutation denial, owner/admin/member/viewer role semantics, and authorized reads.

| Action | Owner | Admin | Member | Viewer |
| --- | :---: | :---: | :---: | :---: |
| Read workspace, companies, datasets, analyses, scenarios, files and activity | Yes | Yes | Yes | Yes |
| Create/update/archive companies | Yes | Yes | Yes | No |
| Create/version/archive datasets | Yes | Yes | Yes | No |
| Execute analysis | Yes | Yes | Yes | No |
| Create/update/archive scenarios | Yes | Yes | Yes | No |
| Upload/delete files | Yes | Yes | Yes | No |
| Manage members | Yes | Yes | No | No |
| Archive workspace | Yes | No | No | No |

The validated deployment model is server-mediated: application tables have no active RLS policies, and the Session Pooler database connection is used only by trusted server code. Server-side workspace authorization is therefore mandatory and was validated against real User A/User B access plus owner/admin/member/viewer roles. Browser code has no direct database client. The optional defense-in-depth policy draft is [supabase-rls-policies.sql](supabase-rls-policies.sql); it must be reviewed and applied deliberately before any future authenticated client-context database access.

## JSONB, lineage and precision review

`financial_dataset_versions.canonical_input` preserves an immutable canonical contract and is parsed with `parseFinancialAnalysisInput()` before use. `analysis_results.payload` and `scenario_results.payload` use a versioned `AnalysisSnapshot` envelope and are parsed before returning a domain result. `scenario_assumptions.assumptions` is a versioned cohesive control contract and is parsed on both creation and recovery. `activity_events.metadata` is intentionally small scalar metadata; it excludes raw financial payloads and credentials.

No financial formula, score, DuPont calculation or insight is persisted as a replacement for the domain engine. A dataset edit creates a new immutable version; analysis and scenario lineage reference that exact version plus engine/schema versions. Tests demonstrate v1 remains unchanged after v2 is created and that failed analysis creates no result payload.

## Storage review

`StorageService` supports upload, private signed retrieval, deletion and existence checks. `FileService` accepts only PDF, CSV and XLSX up to 20 MiB, rejects path separators, uses generated workspace/company-scoped keys, treats the original filename as metadata, checks workspace access before signed URLs, and compensates an upload when metadata persistence fails. File deletion soft-deletes metadata before removing the private object, so a storage-deletion failure cannot leave a downloadable metadata record; production operations should monitor and clean any unreachable orphan object.

The configured private Supabase bucket was validated with generated tenant-scoped object keys, upload, signed retrieval, public-read denial, deletion and database metadata linkage. Foreign-workspace access was denied by the server service. The service role remains server-only.

## Health and environment review

`GET /api/health` is intentionally database-only. Without `DATABASE_URL`, it returns `503 {"status":"not-configured"}`. With a configured database it returns `200 {"status":"ready"}` after `SELECT 1`; failures return `503 {"status":"unavailable"}`. It does not claim Auth or Storage health, so provider configuration cannot be inferred from this endpoint.

Required variable names are `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and optional `ANALYSIS_ENGINE_VERSION`. They are documented without values in `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` is read solely by the server storage adapter; public variables contain only the Supabase URL and publishable key.

## Live integration evidence

- `npm run db:check` completed a real `SELECT 1` through the Supabase Session Pooler.
- `npm run db:migrate` applied the repository Drizzle migrations; real-schema inspection confirmed all 15 application tables, required enums, primary/foreign-key coverage, uniqueness indexes, archive fields, `numeric(20,6)` financial precision and applied migration records. No application-schema drift was found.
- `GET /api/health` was invoked through its route handler with the configured database and returned `200` / `ready`.
- Synthetic Supabase email/password users produced real claims. Concurrent mapping created one internal user, one personal workspace and one owner membership; User A/User B cross-workspace access was denied.
- Company CRUD/archive, role permissions, workspace/archive behavior, immutable dataset v1-to-v2 lineage, completed and failed analyses, history pagination, scenarios, JSONB recovery, files and activity events all passed against PostgreSQL.
- Private Storage upload, signed retrieval, raw public-read denial, cross-workspace denial, metadata persistence and cleanup passed. Synthetic Auth users, objects and application rows were removed after the check.

Run `npm run db:live:check` only against an intentionally configured non-production validation environment: it writes and removes synthetic records. It does not seed product demo companies.

## Final status

| Area | Status |
| --- | --- |
| Application schema, migrations and server services | Implemented and locally plus live validated |
| Frontend service contract | Implemented and live-validated through services |
| PostgreSQL | **VALIDATED**: Session Pooler connection, Drizzle migrations, schema and live persistence checks |
| Supabase Auth | **VALIDATED**: email/password claims and internal-account mapping with synthetic users |
| Supabase Storage | **VALIDATED**: private bucket, signed access, metadata linkage and cleanup |
| Account frontend UI | Pending by design |

The backend is ready to support the account/frontend phase. It remains a server-mediated database model until a separately approved client-context RLS design is implemented.
