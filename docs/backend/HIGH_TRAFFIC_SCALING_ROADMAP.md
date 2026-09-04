# EQUIVERSE — High-Traffic Production Scaling Roadmap

## Purpose

This document defines the staged work required to evolve EQUIVERSE from the current controlled public-beta architecture into a production platform capable of sustaining materially higher traffic, concurrency, document volume, and operational load.

It is intentionally a **roadmap, not an instruction to over-engineer the current beta**. EQUIVERSE should scale in response to measured usage and bottlenecks, while preserving the existing product experience and the core financial-data integrity rules.

The roadmap prioritizes:

1. reliability before raw throughput;
2. bounded resource consumption before aggressive scaling;
3. tenant isolation and data integrity at every stage;
4. observability before optimization;
5. measured capacity decisions instead of speculative infrastructure;
6. graceful degradation rather than silent corruption;
7. zero regression in PDF provenance and financial-analysis correctness.

---

## Current Beta Baseline

The current production architecture already provides a strong beta foundation:

- Next.js application deployed on Vercel;
- Supabase Auth;
- PostgreSQL / Supabase database;
- server-mediated authorization and workspace isolation;
- private Supabase Storage;
- direct signed PDF upload to private Storage;
- server-side PDF validation and native-text extraction;
- field-level evidence/provenance and review;
- immutable financial datasets and persisted analyses;
- production security headers;
- authenticated workspace flows;
- production health endpoint;
- Vercel deployment/rollback capability.

The current beta is **not expected to absorb unrestricted high-volume traffic yet**. The phases below describe how to reach that level safely.

---

# Phase 0 — Establish Production Measurements

## Goal

Do not scale blind. Establish the metrics that reveal where real capacity is being consumed.

## Implement

- Centralized production error reporting.
- Request-level structured logging with correlation/request IDs.
- Metrics for:
  - signup/login failures;
  - active users;
  - request rates;
  - API/function latency;
  - function errors/timeouts;
  - PDF uploads;
  - PDF sizes and page counts;
  - extraction duration;
  - extraction failures;
  - analyses executed;
  - database query latency;
  - database connection utilization;
  - Storage usage/bandwidth;
  - Vercel function usage;
  - Supabase usage/quotas.
- Alerting for health failures and elevated error rates.
- Basic operational dashboard.

## Exit criteria

Before serious scaling work begins, EQUIVERSE must be able to answer:

- Which endpoint is slow?
- Which operation consumes the most resources?
- Are failures concentrated in Auth, DB, Storage, PDF parsing, or application code?
- What is normal production latency/error rate?

---

# Phase 1 — Production Authentication & Email Capacity

## Goal

Make account creation and recovery reliable when registration volume increases.

## Implement

- Verified transactional SMTP provider.
- Owned sender domain.
- SPF, DKIM and DMARC.
- Correct production Site URL and Auth redirect allowlist.
- Production-safe confirmation and recovery templates.
- Guarded resend-confirmation flow.
- Appropriate Supabase Auth rate limits.
- Anti-enumeration responses.
- Monitoring of email delivery failures.

## Scale considerations

Authentication capacity must not depend on development/default email quotas.

## Exit criteria

Burst registration tests and password-recovery tests succeed without application-generated duplicate email requests or provider quota failures under expected load.

---

# Phase 2 — Distributed Rate Limiting and Quotas

## Goal

Prevent a single user, bot, compromised account, or programming error from consuming disproportionate resources.

## Protect

At minimum:

- signup/login/recovery where not already adequately protected upstream;
- upload-ticket creation;
- signed URL generation;
- PDF upload finalization;
- PDF extraction;
- analysis execution;
- expensive workspace/data endpoints.

## Requirements

- Use a distributed/shared limiter suitable for serverless execution.
- Do **not** use process-local in-memory maps as the production limiter.
- Use dimensions such as:
  - account/user ID;
  - workspace ID;
  - IP where appropriate;
  - operation type.
- Define per-user and per-workspace quotas.
- Return safe `429` responses with retry guidance.
- Log abusive patterns without logging sensitive content.
- Preserve legitimate burst usage.

## Resource guards

Maintain/enforce:

- maximum PDF byte size;
- maximum supported page count;
- extraction timeout/budget;
- upload-ticket expiration;
- one-user/one-workspace ownership rules;
- bounded retries.

## Exit criteria

Automated abuse tests cannot generate unbounded PDF/extraction/analysis workload.

---

# Phase 3 — Decouple Heavy PDF Processing from Web Requests

## Goal

Prevent PDF extraction from competing with interactive web traffic as volume grows.

## Current model

Direct private upload is already preferable to carrying large PDF bodies through standard server actions/functions.

## High-traffic evolution

Move expensive extraction toward an asynchronous job architecture when measured concurrency requires it:

```text
Browser
→ signed private upload
→ ingestion request
→ durable job/queue
→ extraction worker
→ validation/provenance
→ persisted extraction result
→ UI polls/subscribes for completion
```

## Requirements

- Durable queue/job state.
- Idempotent job submission.
- Idempotent processing.
- Retry policy with maximum attempts.
- Dead-letter/failed-job state.
- Cancellation where useful.
- Per-workspace concurrency limits.
- No duplicate dataset creation from retried jobs.
- Safe cleanup of abandoned uploads.
- Provenance invariants remain unchanged.

## Important

Do not introduce asynchronous processing merely for architectural aesthetics. Trigger this phase when synchronous extraction latency/concurrency becomes a measured production constraint.

## Exit criteria

PDF workloads can spike without materially degrading login, workspace navigation, or normal analysis routes.

---

# Phase 4 — Database Connection and Query Scaling

## Goal

Ensure PostgreSQL remains stable as concurrent users and stored analyses grow.

## Audit and implement progressively

- Use the appropriate Supabase connection pooler/serverless connection strategy.
- Track connection pool saturation.
- Identify slow queries with query statistics/logs.
- Add indexes based on measured query plans, especially tenant-scoped access patterns.
- Verify all common list/history routes use pagination.
- Avoid unbounded table scans.
- Avoid N+1 query patterns.
- Keep writes transactional where integrity requires it.
- Keep immutable dataset/analysis invariants enforceable under concurrency.
- Add conflict/idempotency constraints where duplicate submissions are possible.
- Archive/prune operational records according to defined retention policies.

## Candidate high-volume entities

Pay particular attention to growth in:

- activity events;
- file metadata;
- extraction candidates/evidence;
- dataset versions;
- analysis runs/results;
- scenario history.

## Exit criteria

Representative concurrent workloads stay within agreed DB latency and connection-utilization thresholds with no cross-tenant leakage or lost updates.

---

# Phase 5 — Caching Strategy

## Goal

Reduce repeated computation and database load without serving stale/private data incorrectly.

## Candidates

- Public landing/static assets: CDN/browser caching.
- Immutable persisted analysis results: safe immutable caching where authorization remains enforced.
- Static methodology/reference content.
- Expensive deterministic computations keyed by immutable dataset/version + engine version, if profiling shows material benefit.

## Do not cache blindly

Avoid unsafe shared caching for:

- workspace-private mutable state;
- authorization decisions;
- signed private URLs beyond their intended lifetime;
- session-dependent responses;
- data that may cross tenant boundaries.

## Requirements

- Explicit cache keys.
- Explicit invalidation semantics.
- Private/public cache separation.
- Cache headers verified in production.

## Exit criteria

Cache hit rates reduce measured backend load without introducing stale authorization or financial-data correctness bugs.

---

# Phase 6 — Storage, Bandwidth and Document Lifecycle

## Goal

Keep private document storage predictable as uploads grow.

## Implement

- Storage usage metrics per workspace/user.
- Quotas for file count and/or stored bytes.
- Retention policy for abandoned uploads and failed ingestion artifacts.
- Orphan detection:
  - DB metadata without Storage object;
  - Storage object without DB metadata.
- Safe scheduled cleanup process.
- Short-lived signed download URLs.
- Explicit MIME/content validation.
- Object naming that avoids collisions.
- Storage lifecycle/cost review as document volume increases.

## Security invariants

- Bucket remains private.
- No public listing.
- Server authorization remains required before issuing signed access.
- Storage path knowledge alone must never grant access.

## Exit criteria

Storage growth is measurable, bounded per tenant where required, and orphaned/failed objects have a safe lifecycle.

---

# Phase 7 — Resilience, Backups and Disaster Recovery

## Goal

High traffic is irrelevant if user data cannot be recovered after an incident.

## Implement / verify

- Database backup policy appropriate to the production plan.
- Backup retention.
- Point-in-time recovery when justified by usage/business requirements.
- Migration reproducibility.
- Documented restore procedure.
- Storage recovery strategy.
- Recovery ordering between database metadata and private objects.
- Rollback strategy for application deployments.
- Compatibility rules for rolling back application code after schema changes.

## Test

Perform periodic non-destructive restore/recovery exercises in an isolated environment.

## Define

- RPO: acceptable data-loss window.
- RTO: acceptable recovery time.

## Exit criteria

A documented and tested procedure exists for recovering the service and identifying any irrecoverable gap.

---

# Phase 8 — Security at Scale

## Goal

Preserve current tenant isolation/security guarantees under significantly higher exposure and automation.

## Continue hardening

- Dependency/security scanning.
- Secret scanning.
- IDOR/BOLA regression tests.
- Role/vertical authorization tests.
- File ownership tests.
- Upload-ticket replay tests.
- Signed URL authorization tests.
- CSRF/session review as architecture evolves.
- CSP/security-header regression validation.
- Payload/schema validation.
- Resource-exhaustion testing.
- PDF parser dependency/security review.
- Audit events for privileged/sensitive operations.

## Edge/WAF considerations

When traffic/abuse warrants it, evaluate:

- bot protection;
- WAF rules;
- IP reputation/challenge mechanisms;
- DDoS/edge protections available on the hosting plan.

Do not rely on edge controls as a substitute for tenant authorization.

## Exit criteria

Adversarial automated tests demonstrate that increasing request volume does not weaken authorization, storage privacy, or data-integrity invariants.

---

# Phase 9 — Load, Concurrency and Soak Testing

## Goal

Establish real capacity with controlled tests before expecting high traffic.

## Build representative test scenarios

### Read-heavy

- landing traffic;
- authenticated workspace reads;
- analysis-history reads;
- reopening persisted analyses.

### Write-heavy

- concurrent signups;
- company creation;
- dataset confirmation;
- scenario persistence.

### Compute-heavy

- concurrent analysis runs;
- concurrent PDF extraction jobs.

### Storage-heavy

- concurrent signed uploads;
- signed download generation.

## Test styles

- baseline load test;
- burst/spike test;
- sustained/soak test;
- recovery after overload;
- dependency degradation tests.

## Measure

- p50/p95/p99 latency;
- error rate;
- timeout rate;
- queue depth if asynchronous;
- DB connections;
- DB latency;
- CPU/memory/function duration where available;
- Storage throughput;
- cost/usage growth.

## Rules

Never load-test production destructively without explicit safeguards and provider-policy review. Prefer isolated/staging environments for aggressive tests.

## Exit criteria

EQUIVERSE has a documented tested capacity envelope and known bottlenecks.

---

# Phase 10 — SLOs, Alerting and Incident Operations

## Goal

Turn production from a manually observed website into an operable service.

## Define service indicators

Examples:

- availability;
- authentication success rate;
- API error rate;
- interactive request latency;
- PDF ingestion success rate;
- extraction processing time;
- analysis success rate.

## Define SLOs only from real requirements

Do not choose arbitrary enterprise-grade numbers before the product needs them.

## Alert on symptoms that matter

- health endpoint failures;
- elevated 5xx rate;
- Auth failure spikes;
- DB saturation;
- extraction failure spikes;
- queue backlog;
- storage/database quota thresholds;
- deployment regression.

## Operations

Create short runbooks for:

- Auth outage;
- database outage;
- Storage outage;
- PDF extraction degradation;
- bad deployment;
- compromised credential/key rotation;
- unusual abuse/cost spike.

## Exit criteria

A production incident can be detected, triaged and mitigated without relying on a user reporting it first.

---

# Phase 11 — Cost Controls and Capacity Governance

## Goal

Ensure scaling traffic does not produce uncontrolled infrastructure cost.

## Track

- Vercel function execution/transfer;
- Supabase compute/database usage;
- Storage bytes;
- Storage egress;
- Auth/email volume;
- external rate-limiter/queue usage if introduced;
- observability ingestion volume.

## Implement

- plan-level usage alerts where available;
- per-user/workspace quotas;
- PDF size/page constraints;
- bounded retries;
- bounded job concurrency;
- retention policies;
- anomaly monitoring;
- explicit upgrade thresholds.

## Exit criteria

The team can estimate which workloads drive spend and detect abnormal usage before it becomes material.

---

# Phase 12 — Release Architecture and Environment Separation

## Goal

Allow continued development without turning every feature change into a production risk.

## Recommended target

```text
main
→ production

feature/* / codex/*
→ preview deployments

local
→ development
```

## Implement

- clear production branch strategy;
- environment-specific variables;
- production/preview/development separation;
- migration discipline;
- pre-deploy CI gates;
- health/smoke checks after deployment;
- documented rollback;
- optional staged/canary release strategy when traffic justifies it.

## Exit criteria

Feature development, previews and production releases are operationally separated and reversible.

---

# Phase 13 — Multi-Region / Advanced Scale (Only When Required)

## Goal

Address geographic latency or very high availability requirements only after they are real constraints.

Possible future work:

- regional execution strategy;
- read replicas;
- geographic routing;
- cross-region failover;
- queue/worker regionalization;
- regional storage/data-residency strategy;
- advanced CDN strategy.

These changes materially increase operational complexity and must **not** be introduced early without measured need.

---

# Scaling Triggers

The phases above should be activated by measured triggers rather than arbitrary user-count milestones.

Examples of useful triggers:

| Signal | Likely response |
|---|---|
| Auth emails hit provider/project limits | Phase 1 |
| Repeated abusive/automated expensive requests | Phase 2 |
| PDF extraction causes function timeout/concurrency pressure | Phase 3 |
| DB pool saturation or sustained slow queries | Phase 4 |
| Repeated reads/computation dominate backend usage | Phase 5 |
| Storage growth/egress becomes material | Phase 6 |
| Product becomes business-critical | Phase 7 + Phase 10 |
| Public exposure attracts automated abuse | Phase 8 |
| Traffic forecast materially exceeds observed baseline | Phase 9 |
| Infrastructure spend becomes non-trivial | Phase 11 |
| Multiple developers/features ship concurrently | Phase 12 |
| Geographic latency/availability becomes a real constraint | Phase 13 |

---

# High-Traffic Invariants

The following EQUIVERSE guarantees must survive every scaling phase.

## Financial integrity

- Never invent unsupported financial values.
- PDF-derived values retain evidence/provenance.
- User overrides preserve original evidence.
- Immutable dataset history remains immutable.
- Retries cannot create inconsistent duplicate canonical results.

## Tenant isolation

- Workspace ownership/role checks remain server-enforced.
- A known UUID from another tenant never grants access.
- Private Storage remains private.
- Signed access remains short-lived and authorization-gated.

## Security

- No service-role/database secrets reach the browser.
- No sensitive tokens appear in logs.
- Scaling infrastructure must not bypass existing authorization.

## UX

- Scaling changes should preserve the approved EQUIVERSE visual system.
- Heavy operations should degrade gracefully with clear status rather than freezing or silently failing.

---

# Suggested Maturity Stages

## Stage A — Controlled Beta

Suitable when:

- traffic is low/moderate;
- usage is monitored manually/semiautomatically;
- current synchronous paths remain within platform limits;
- known beta limitations are accepted.

Primary focus:

- Auth/email reliability;
- legal/privacy/account lifecycle;
- rate limiting;
- baseline observability;
- backup awareness.

## Stage B — Growing Public Product

Add:

- distributed quotas;
- stronger monitoring/alerting;
- DB/query tuning;
- storage lifecycle;
- regular load testing;
- defined recovery procedures;
- stronger release discipline.

## Stage C — High-Traffic Production

Add when measured demand requires:

- durable asynchronous PDF processing;
- explicit capacity planning;
- advanced caching;
- dedicated workload isolation;
- formal SLOs/runbooks;
- advanced cost governance;
- possible multi-region architecture.

---

# Pre-High-Traffic Checklist

Before EQUIVERSE is intentionally exposed to materially higher traffic, verify:

- [ ] Transactional SMTP and sender domain are production-ready.
- [ ] Auth confirmation/recovery/resend flows are tested.
- [ ] Distributed rate limiting protects expensive operations.
- [ ] Per-user/workspace resource quotas are defined.
- [ ] Production logs/metrics/alerts exist.
- [ ] PDF resource limits are enforced.
- [ ] Heavy PDF processing has a migration path to durable async jobs.
- [ ] DB connection pooling is appropriate for serverless concurrency.
- [ ] Slow-query/index review has been completed using real usage.
- [ ] All growing collections are paginated/bounded.
- [ ] Private caching boundaries are documented.
- [ ] Storage lifecycle/orphan cleanup is implemented.
- [ ] Database backup/recovery is documented and tested.
- [ ] Storage recovery expectations are documented.
- [ ] Security regression suite covers tenant isolation and abuse paths.
- [ ] Representative load/spike/soak tests have established capacity.
- [ ] Cost/usage thresholds and alerts are defined.
- [ ] Production/preview/development environments are separated.
- [ ] Rollback procedures are documented and tested.
- [ ] Incident runbooks exist for critical dependencies.

---

# Principle for Future Work

**Scale the bottleneck that measurements prove exists.**

EQUIVERSE should not be converted into a complex distributed system merely because it may have many users one day. Each phase should be introduced when traffic, latency, reliability, security, or cost data demonstrates that the additional complexity provides a concrete benefit.

The target is not theoretical infinite scalability. The target is a production architecture with a known capacity envelope, bounded failure modes, strong financial-data integrity, predictable costs, and a clear next scaling step whenever demand grows.
