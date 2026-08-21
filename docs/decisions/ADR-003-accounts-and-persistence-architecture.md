# ADR-003: Accounts and workspace persistence architecture

**Status:** Accepted

## Context

The initial product operated as a browser-local analytical application. Its canonical financial input, ratios, scoring, DuPont and scenarios are pure deterministic domain logic, but users could not retain work securely or collaborate within a durable workspace.

## Decision

Use PostgreSQL with Drizzle as the relational and migration source of truth. Introduce workspace-scoped users, memberships, companies, immutable dataset versions, normalized canonical statement values, analysis runs/results, scenarios, file metadata and minimal activity events. Use Supabase Auth for external identity and Supabase Storage behind a project-owned storage interface. Retain only validated complex analysis and scenario payloads in JSONB with explicit schema versions.

Authorization is always enforced in server application services, then may be reinforced with reviewed Supabase RLS policies. Existing local browser persistence remains temporary/anonymous only until a separately approved frontend account migration.

## Consequences

- Historical analysis is reproducible by immutable dataset-version lineage.
- Passwords and credential handling remain outside business tables.
- The model supports future multi-member workspaces without claiming a collaboration UI now.
- Local clean-database validation is available through PGlite; production PostgreSQL/Supabase provisioning is still external work.
- This approved backend phase supersedes historic MVP documents that list authentication, databases or backend infrastructure as out of scope. It does not alter financial methodology or browser-facing product behaviour.
