# EQUIVERSE Privacy Data Inventory

## Active beta processing

| Category | Source and location | Purpose | Retention and deletion | Sensitivity |
| --- | --- | --- | --- | --- |
| Account identity | Supabase Auth; internal `users` table | Authentication and workspace bootstrap | Active while account exists; eligible account deletion removes active identity and internal record | Personal |
| Session cookies | Supabase browser and server session cookies | Authenticated sessions | Browser/session lifecycle; sign-out clears the local session | Personal |
| Workspace membership | PostgreSQL `workspaces`, `workspace_members` | Tenant isolation and authorization | Retained while active; shared membership blocks self-deletion | Personal/authorization |
| Company and financial data | PostgreSQL companies, datasets, versions, statements, analyses, scenarios | Financial analysis and immutable history | Retained while active; eligible personal-workspace deletion removes it | Financial/private |
| PDFs and metadata | Private Supabase Storage; PostgreSQL `files` | Source-document storage and provenance | Individual file deletion or eligible account deletion removes active objects and metadata | Financial/private |
| Extraction evidence | PostgreSQL extraction runs, candidates and draft fields | Reviewable PDF extraction | Removed with eligible personal workspace | Financial/private |
| Activity events | PostgreSQL `activity_events` | Workspace audit trail | Removed with eligible personal workspace | Personal/financial context |
| Safe server failures | Vercel runtime logs | Diagnose failures without inputs or secrets | Provider-controlled retention | Operational metadata |

## Not active

The application does not include Google Analytics, Vercel Analytics, advertising trackers, third-party analytics, external AI providers, or external PDF-processing services. Native PDF extraction runs in the application pipeline.

## Infrastructure limitation

Active application records and private objects can be deleted. Provider backup retention and runtime-log retention are controlled by Supabase and Vercel and are not represented as immediate physical erasure.
