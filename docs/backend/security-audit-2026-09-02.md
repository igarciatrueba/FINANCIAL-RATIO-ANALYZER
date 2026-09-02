# EQUIVERSE security audit - 2026-09-02

## Scope and result

This audit covered the authenticated accounts/workspace boundary, private
document ingestion, database and Storage authorization, browser session handling,
HTTP response headers, PDF parsing limits, dependency posture, and production
build output. It did not change financial methodology, scoring, scenarios, or
the approved frontend visual system.

The application uses a **server-mediated authorization model**. Browser code
does not receive a database client or a Supabase service-role credential.
Server actions resolve the authenticated Supabase subject again on the server,
then enforce internal user, workspace membership, and role authorization before
accessing repositories or private Storage. Application-table RLS is intentionally
not enabled for the trusted server Session Pooler connection; the optional RLS
draft remains a future defence-in-depth decision for any client-context database
access.

## Verified controls

- Auth return paths accept only same-origin paths and reject protocol-relative,
  backslash, encoded-slash and malformed alternatives.
- Every reviewed financial input field is strict; provenance is server-derived
  and cannot be injected by a client payload.
- Dataset confirmation requires a complete, reviewed draft whose values match
  the canonical parsed input. An incomplete extraction cannot be linked to an
  immutable dataset.
- Failed PDF parsing soft-deletes file metadata and compensates by removing the
  private object. Parser failures are returned as safe validation errors.
- PDF extraction is native-text only, bounded by file size, page count and
  per-page token limits. There is no active OCR provider or remote parser.
- Cross-workspace access, viewer mutations, malformed identifiers and
  client-supplied ownership fields are rejected by service tests.
- Production responses send a restrictive CSP, `frame-ancestors 'none'`,
  `X-Frame-Options: DENY`, `nosniff`, strict referrer policy, restrictive
  permissions policy, COOP and HSTS. Workspace and account routes are private
  and non-cacheable. No permissive CORS response was observed on `/api/health`.
- The service role is used only by server Storage code. No credential files are
  tracked; client build-output scanning found no configured database or
  service-role secret values.
- The production dependency audit contains no production vulnerabilities after
  the Next.js and `nanoid` updates.

## Validation evidence

The full unit, PGlite/database, annual-report corpus and real Supabase
upload-to-analysis checks are run by the repository scripts. The live flow
creates only isolated QA records, verifies private upload, evidence access,
manual value and override handling, immutable dataset confirmation, persisted
analysis and a two-period/manual-slot path, then confirms cleanup of its users,
rows and objects.

## Residual operational requirements

- Configure request-rate and abuse controls at the deployment edge before
  exposing authenticated PDF processing publicly. The application bounds upload
  size and parser work, but an in-process distributed rate limiter is not a
  reliable replacement for edge controls.
- The remaining `npm audit` findings are four **development-only moderate**
  transitive findings under `drizzle-kit`'s build tooling. The currently offered
  automatic remediation changes `drizzle-kit` incompatibly, so it was not
  applied without a reviewed upgrade path. Production dependencies report zero
  vulnerabilities.
- Treat the server-mediated authorization model as mandatory until a separately
  reviewed RLS/client-context architecture is introduced. Future direct browser
  database access must not reuse this trust model.
