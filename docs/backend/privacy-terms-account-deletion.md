# Privacy, Terms and Account Deletion

## Beta deletion policy

Self-service deletion is allowed only when every active workspace membership is a sole-member workspace owned by the current user. Any shared membership, including owner, admin, member or viewer status, blocks deletion. This avoids deleting other users' workspace data or retaining records with a deleted creator identity. Ownership transfer and leaving shared workspaces are future product capabilities.

## Lifecycle

1. The server resolves the authenticated identity and internal user. Client identifiers are not accepted.
2. The service rejects shared-workspace membership.
3. It enumerates private-file keys for eligible workspaces and deletes private objects.
4. A PostgreSQL transaction removes extraction records, activity, metadata, scenarios, analyses, immutable datasets, statements, companies, memberships, workspaces and the internal user.
5. Supabase Auth identity deletion occurs last. The browser signs out and returns to the public application.

Storage and database are not one distributed transaction. If Storage deletion fails, database deletion does not start. If database deletion succeeds but Auth deletion fails, active financial data is already inaccessible; the residual Auth identity must be retried or handled by support. Storage deletion is safe to retry.

## Export decision

Structured self-service export is deferred. It would need a scoped, downloadable format across immutable financial history and PDFs, plus authorization and retention guarantees. It is not needed to make the beta deletion path safe.

## Legal owner fields

The public Privacy and Terms pages deliberately identify missing privacy, terms, operator and governing-law contact details as configuration required before broad public release. They do not invent legal facts.
