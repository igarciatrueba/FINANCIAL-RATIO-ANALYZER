# Annual Report PDF Ingestion V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated EQUIVERSE users extract evidenced native-text annual-report values into the existing editable Financial Input flow without changing the canonical analysis engine.

**Architecture:** A server-only, parser-first ingestion feature creates sparse extraction drafts rather than canonical inputs. The extraction draft retains candidate evidence, provenance, confidence, review state, and period slots; Financial Input remains the explicit strings-to-canonical-parser boundary. Confirming a valid form uses the existing immutable dataset and analysis services.

**Tech Stack:** Next.js 16 server actions, TypeScript, Zod, Drizzle/PostgreSQL/Supabase private Storage, React Hook Form, Vitest, `pdfjs-dist@6.3.289` server-only native PDF parsing.

**Spec:** `docs/superpowers/specs/2026-08-30-annual-report-pdf-ingestion-design.md`

## Global Constraints

- Every canonical number must come from PDF evidence, explicit user acceptance/input, or an evidenced deterministic derivation; otherwise it remains unresolved.
- Keep provenance (`PDF_EXTRACTED`, `USER_PROVIDED`, `USER_OVERRIDE`, `DERIVED`, `NOT_FOUND`, `CONFLICT`) independent from review state (`UNREVIEWED`, `NEEDS_REVIEW`, `USER_CONFIRMED`).
- A two-year report leaves slot 1 as `fiscalPeriod = null`; never synthesize a year, shift a source year, retrieve another report, or merge PDFs.
- Medium candidates require explicit acceptance. Low, conflicting, missing, or unsupported candidates never populate the form.
- V1 is authenticated-only, native-text-only, no OCR, no external AI/LLM, no public files, no anonymous temporary upload.
- Do not alter `FinancialAnalysisInput`, `parseFinancialAnalysisInput()`, ratios, scoring, DuPont, scenarios, demos, or approved V2 visual language.
- Private-file and extraction operations resolve actor/workspace server-side; browser code never receives storage keys or privileged credentials.
- Use TDD: write focused failing tests, observe failure, implement the smallest behavior, rerun focused tests, then commit each gate.

---

## Existing Integration Map

| Need | Reuse / extend | Must not change |
| --- | --- | --- |
| Canonical input and three-period validation | `src/domain/types.ts`, `src/domain/schemas.ts`, `src/features/financial-input/form-transform.ts` | Canonical shape, numeric parser behavior, exact-three-period parser rules |
| Form fields and labels | `src/features/financial-input/types.ts`, `field-metadata.ts`, `workflow.tsx` | Current string-form conversion boundary and manual workflow |
| Local draft/session behavior | `src/features/financial-input/persistence.ts` | Existing anonymous draft/session keys and recovery semantics |
| Company and immutable datasets | `src/server/services/company-service.ts`, `financial-dataset-service.ts`, `src/server/datasets/canonical-statement-mapper.ts` | Dataset version immutability and canonical validation before storage |
| Persistent analysis | `src/server/services/analysis-history-service.ts` | `analyseFinancialStatements()` and snapshot lineage |
| Private files | `src/server/services/file-service.ts`, `src/server/storage/types.ts`, `supabase-storage-service.ts`, `src/app/workspace/actions.ts` | Generated storage keys, short-lived signed URLs, MIME allow-list, workspace authorization |
| Authorization and account bootstrap | `src/server/accounts/account-context.ts`, `authorization-service.ts`, `require-authenticated-user.ts` | Server-mediated workspace membership/role checks |
| Schema/repository | `src/server/db/schema.ts`, `src/server/repositories/backend-repository.ts`, `drizzle/` | Existing persisted-data tables, existing RLS/server-side decision |
| Financial Input route | `src/app/input/page.tsx` | Route identity, AppShell, existing visual system |

High-risk modules explicitly out of scope: `src/domain/analyse-financial-statements.ts`, `src/domain/ratios/**`, `src/domain/scoring/**`, `src/domain/dupont/**`, `src/domain/scenarios/**`, demo-company values, and existing database tables' historical data semantics.

## Planned Data Model

New rows are extraction artifacts. They do not replace or mutate `financial_dataset_versions`.

```text
files (private PDF)
  1 -> N document_extraction_runs
  1 -> N document_extraction_candidates
  1 -> N document_extraction_draft_fields
document_extraction_runs
  0..1 -> confirmed financial_dataset_versions
```

### `document_extraction_runs`

| Field | Notes |
| --- | --- |
| `id`, `workspace_id`, `file_id`, `requested_by`, `company_id?` | UUID lineage and tenant scope; `file_id` is an existing private file |
| `status` | `pending`, `processing`, `ready_for_review`, `failed`, `unsupported`, `superseded` |
| `engine_version`, `schema_version` | Stable parser/mapping lineage |
| `document_summary` | JSONB: statement discovery, scope, currency, scale, slots, counts, page capabilities; never provider reasoning |
| `safe_failure_code?`, `safe_failure_message?` | Product-safe terminal details only |
| `confirmed_dataset_version_id?`, `confirmed_at?` | Link after successful existing dataset confirmation; no reverse mutation |
| timestamps | create/start/complete/update lineage |

Indexes: `(workspace_id, created_at desc, id desc)`, `(file_id, created_at desc)`, `(company_id, created_at desc)`, and unique active retry key `(file_id, engine_version, checksum)` where status is nonterminal if PostgreSQL partial indexing fits existing migration conventions.

### `document_extraction_candidates`

One row per direct or derived candidate, never just the selected value. Fields: `run_id`, `canonical_field_key`, `period_slot_index`, `candidate_kind` (`direct`, `aggregation`, `average`), `normalized_value numeric(20,6)?`, `confidence` (`high`, `medium`, `low`), `mapping_id`, `confidence_reasons jsonb`, `diagnostics jsonb`, `source_evidence jsonb`, `source_candidate_ids jsonb` for derivation, `is_selected`, timestamps. `source_evidence` contains page, x/y/width/height when available, source label/text, raw value, statement, scope, source rank, extraction mode, fiscal period, currency, and scale.

Indexes: `(run_id, canonical_field_key, period_slot_index)`, `(run_id, is_selected)`, and `(run_id, confidence)`.

### `document_extraction_draft_fields`

Exactly one current review state per extraction field/slot. Fields: `run_id`, `canonical_field_key`, `period_slot_index`, `current_candidate_id?`, `original_candidate_id?`, `provenance_type`, `review_state`, `form_value text?`, `accepted_by?`, `accepted_at?`, `overridden_by?`, `overridden_at?`, `resolution_note?`, timestamps. Unique `(run_id, canonical_field_key, period_slot_index)`.

`form_value` remains a form string. A high candidate writes its normalized plain-number string but remains `PDF_EXTRACTED` / `UNREVIEWED`; medium candidate leaves `form_value` empty until explicit acceptance. An override keeps both candidate IDs and becomes `USER_OVERRIDE`. A manual empty/new value is `USER_PROVIDED`. The missing source period is represented on the run's slot array, not persisted as a fake year.

### Migration lifecycle

Create enums/tables/repository methods in one migration after PGlite migration tests. The migration adds foreign keys to `files`, `workspaces`, `companies`, `users`, and `financial_dataset_versions`; it does not change existing canonical table columns or backfill historical data. Generate SQL, run clean DB tests, migrate real Supabase only after review gate and run live schema/drift checks.

## Canonical Field Specification

All fields below are required by the current form/canonical parser for every submitted period. Direct extraction means an exact or explicit synonym from the listed statement; otherwise the field stays unresolved unless the documented derivation is fully evidenced and valid.

| Canonical key | Primary statement | Accepted aliases | Explicit exclusions | Source / derivation requirement |
| --- | --- | --- | --- | --- |
| `revenue` | Income statement | Revenue; Net revenue; Sales; Net sales; Turnover; Operating revenue | Gross profit; segment revenue; order intake | Direct only; one source period |
| `costOfGoodsSold` | Income statement | Cost of goods sold; Cost of sales; Cost of revenue; Cost of products sold | Operating expenses; SG&A; depreciation alone | Direct only; one source period |
| `ebit` | Income statement | EBIT; Earnings before interest and tax; Operating profit where statement context explicitly proves pre-interest/pre-tax operating result | EBITDA; adjusted EBITDA; EBITA; profit before tax | Direct only; one source period; ambiguous operating-profit label is medium/review |
| `interestExpense` | Income statement / note | Interest expense; Finance costs; Net finance expense only when components show it is expense and not net income | Interest income; finance income; net interest income | Direct only; one source period |
| `netIncome` | Income statement | Net income; Net profit; Profit for the year; Profit attributable to owners only when canonical policy selects group total | Comprehensive income; EPS; adjusted profit | Direct only; one source period |
| `cash` | Balance sheet | Cash and cash equivalents; Cash; Cash and short-term deposits | Restricted cash unless statement total explicitly includes it | Direct only; closing balance |
| `accountsReceivable` | Balance sheet / note | Trade receivables; Accounts receivable; Trade and other receivables only when trade subtotal is explicit | Contract assets; other receivables alone | Direct only; closing balance |
| `inventory` | Balance sheet | Inventories; Inventory; Stocks | Biological assets; finished goods alone | Direct only; closing balance |
| `currentAssets` | Balance sheet | Current assets; Total current assets | Working capital; liquid assets | Direct only; closing balance |
| `totalAssets` | Balance sheet | Total assets; Total assets and liabilities heading only if row value is assets | Current assets; net assets | Direct only; closing balance |
| `currentLiabilities` | Balance sheet | Current liabilities; Total current liabilities | Current debt alone; working capital | Direct only; closing balance |
| `totalDebt` | Balance sheet / debt note | Total debt; Borrowings; Interest-bearing debt | Net debt; lease liabilities unless mapping policy explicitly includes them | Direct if explicit; otherwise aggregation of evidenced included short/long-term borrowings for the same period only |
| `equity` | Balance sheet | Total equity; Shareholders' equity; Equity attributable to owners when policy selects group equity | Market capitalization; tangible equity; non-controlling interest alone | Direct only; closing balance |
| `operatingCashFlow` | Cash flow statement | Net cash from operating activities; Cash generated from operations; Operating cash flow | Free cash flow; EBITDA; operating profit | Direct only; one flow period |
| `capitalExpenditure` | Cash flow statement / PPE note | Capital expenditure; Purchases of property, plant and equipment; Additions to PPE | Total investing cash flow; acquisitions; depreciation | Direct cash expenditure, normalized positive even when source uses parentheses; one flow period |
| `averageInventory` | Derived from balance sheet | N/A | Closing inventory represented as an average | `(inventory opening + inventory closing) / 2`; requires same-field evidence for prior/current fiscal periods |
| `averageReceivables` | Derived from balance sheet | N/A | Closing receivables represented as an average | `(receivables opening + receivables closing) / 2`; requires same-field evidence for prior/current fiscal periods |
| `averagePayables` | Derived from balance sheet / note | Trade payables; Accounts payable; Trade and other payables only when trade subtotal explicit | Accruals; tax payable; total current liabilities | `(payables opening + payables closing) / 2`; requires same-field evidence for prior/current fiscal periods |

The mapping configuration will assign statement type, alias normal forms, source priority, accepted scope, exclusions, confidence penalties, and derivation IDs. It is pure data in `src/features/annual-report-ingestion/lib/canonical-field-mapping.ts`, not UI copy. It never maps a close-looking value merely to increase recall.

## Interfaces and Algorithms

```ts
type ParsedPdfPage = {
  pageNumber: number;
  extractionMode: "native_text" | "scanned_page_unsupported";
  tokens: Array<{ text: string; x: number; y: number; width: number; height: number }>;
};

interface DocumentTextExtractionProvider {
  extract(input: { bytes: Uint8Array; limits: PdfResourceLimits }): Promise<{ pageCount: number; pages: ParsedPdfPage[] }>;
}

type FinancialCandidate = {
  canonicalFieldKey: CanonicalFieldKey;
  slotIndex: 0 | 1 | 2;
  normalizedValue: number | null;
  evidence: SourceEvidence[];
  confidence: "high" | "medium" | "low";
  diagnostics: ExtractionDiagnostic[];
  derivation?: { id: "total-debt-components" | "average-closing-balances"; inputCandidateIds: string[] };
};

type ExtractionDraft = {
  runId: string;
  company: { name: string; industry: string; currency: "EUR" | "USD" | "GBP" | null };
  periodSlots: [ExtractionPeriodSlot, ExtractionPeriodSlot, ExtractionPeriodSlot];
  fields: ExtractionDraftField[];
  summary: ExtractionSummary;
};
```

Pipeline boundaries:

1. `validate-pdf-upload.ts`: validates bytes, `%PDF-` signature, MIME, 20 MiB max, filename, 250-page cap, and request-level limits.
2. `native-pdf-text-provider.ts`: wraps `pdfjs-dist` server-only, emits tokens by page, and classifies insufficient-text pages as scanned unsupported.
3. `reconstruct-layout.ts`: groups tokens into tolerance-based lines/rows/columns without reading financial meaning.
4. `discover-financial-statements.ts`: identifies headings, table headers, statement scope, source rank, currency/scale context, and candidate fiscal columns.
5. `extract-row-candidates.ts`: finds labels plus value cells, excludes footnote numerals/page furniture, and records raw evidence.
6. `canonical-field-mapping.ts` plus `map-candidates.ts`: matches aliases/exclusions, ranks scope/source candidates, and detects duplicate/conflicting values.
7. `normalize-financial-value.ts`: parses raw numeric strings and declared unit/scale, preserves original, rejects nonfinite/dash/ambiguous content.
8. `derive-financial-fields.ts`: derives only documented aggregation/averages from selected evidenced candidates.
9. `validate-extraction.ts`: records reconciliation signals and confidence adjustments; it never writes another numeric value.
10. `build-extraction-draft.ts`: applies confidence/review policy and creates form-string sidecar data.

### Period-resolution algorithm

1. Collect fiscal columns only from selected statement tables; retain source label, optional four-digit year, end date, table/page/order, and scope.
2. Normalize a period identity by end date when present, otherwise unique year+label. Never convert FY labels into a guessed calendar year.
3. Reject duplicate identities with incompatible currency/scope as a conflict; do not merge them.
4. Sort resolved identities oldest-to-newest by known end date, then numeric year, then source table column order. Detect descending table order and reverse presentation only; values stay paired to original column evidence.
5. If exactly three identities exist, assign slots `[0,1,2]` in that sorted order.
6. If two exist, assign slots `[1,2]`; slot `0` has `fiscalPeriod: null` and `manual_input_required`.
7. If one exists, assign slot `2`; slots `0` and `1` are empty. If more than three exist, select the newest three only when they are from one consistent statement set and document the excluded older columns; otherwise request review.
8. A missing label/year is unresolved, not a period guessed from neighboring columns.

Examples: FY2023/FY2024/FY2025 maps `[FY2023,FY2024,FY2025]`; FY2025/FY2024 source columns map `[null,FY2024,FY2025]`; 52 weeks ended 29 June 2024 uses its source label/end date; a table ordered 2025/2024 is mapped by column evidence to slots `[null,FY2024,FY2025]`.

### Accounting validation

`validate-extraction.ts` calculates only diagnostic differences. It uses relative tolerance `max(absoluteTolerance, max(abs(inputs)) * 0.005)` after normalized units. Checks are: assets versus liabilities plus equity only when both total-liabilities and equity evidence exist; revenue minus COGS versus gross profit only when all three evidenced; compatible cross-statement net-income repetitions only as an informational comparison. Any material difference sets `NEEDS_REVIEW` or `CONFLICT`; no candidate is edited, derived, or promoted.

## Real-PDF Corpus and Ground Truth

Use primary publisher/filing sources, retrieve only during validation, and commit source URLs plus manually verified ground-truth fixtures rather than copyrighted PDFs unless licensing permits fixtures.

| Fixture ID | Source | Characteristics to validate |
| --- | --- | --- |
| `microsoft-2024-usd` | [Microsoft Annual Report 2024 PDF](https://www.sec.gov/Archives/edgar/data/789019/000119312524242888/d815777dars.pdf) and [SEC 10-K](https://www.sec.gov/Archives/edgar/data/789019/000095017024087843/msft-20240630.htm) | USD millions, SEC/US GAAP-style filing, June fiscal year, negative parentheses, two-year comparative tables |
| `siemens-2024-eur` | [Siemens Annual Report 2024 PDF](https://assets.new.siemens.com/siemens/assets/api/uuid%3A344347ec-a1bd-44cb-aaaa-711d1b3ec1b8/Siemens-Annual-Report-2024.pdf) | EUR millions, IFRS, dense notes, debt components, consolidated statement discovery |
| `inditex-2024-eur` | [Inditex Consolidated Annual Accounts 2024 PDF](https://www.inditex.com/itxcomweb/api/media/84135f02-0208-4439-b9c0-b13608fbfeb5/Annualaccountsanddirectorsreport2024consolidated.pdf?t=1742203067340) | Spanish listed issuer, EUR, consolidated versus parent/report variants, Spanish/English aliases and layout |
| `diageo-2024-gbp` | [Diageo Annual Report 2024 PDF](https://www.diageo.com/~/media/Files/D/Diageo-V2/Diageo-Corp/investors/results-reports-and-events/annual-reports/diageo-annual-report-2024.pdf) | GBP, UK IFRS report, three-year summaries, negative formats, scope/currency context |
| `mixed-page-native-scan` | Public primary-source document selected during corpus acquisition and pinned by SHA-256 in fixture metadata | Native page extraction alongside a page with no usable text; asserts scanned-page unsupported behavior and zero invented values |

Ground truth is created by two manual passes over each report: first transcribe source label/page/raw unit/value for tested canonical fields; second independently check normalized result and evidence location. Fixtures store only source URL, retrieval date, SHA-256, fiscal label, page, field, raw value, scale, normalized expected value, and reviewer confirmation metadata. No model-generated expected value is accepted. Each run computes `expected`, `autoFilled`, `correct`, `review`, `missing`, `incorrect`, `unsupported`; `unsupported` must equal zero.

## Tasks

### Task 1: Establish extraction contracts and field mapping

**Files:**
- Create: `src/features/annual-report-ingestion/types.ts`
- Create: `src/features/annual-report-ingestion/lib/canonical-field-mapping.ts`
- Create: `src/features/annual-report-ingestion/lib/extraction-periods.ts`
- Test: `src/test/annual-report-field-mapping.test.ts`
- Test: `src/test/annual-report-period-resolution.test.ts`

**Interfaces:** Produces `CanonicalFieldKey`, `ExtractionPeriodSlot`, `SourceEvidence`, `FinancialCandidate`, `ExtractionDraftField`, `resolvePeriodSlots()` and `fieldMapping` for all later parser/persistence/UI tasks.

- [ ] Write failing tests for all 18 form fields, accepted aliases, explicit exclusions, a two-year slot array `[null,FY2024,FY2025]`, reversed source columns, duplicate fiscal periods, and an unusual end date.
- [ ] Run `npx vitest run src/test/annual-report-field-mapping.test.ts src/test/annual-report-period-resolution.test.ts`; expect imports/functions to be missing.
- [ ] Implement the pure types, mapping configuration, and period resolver exactly as specified above. Keep period identity source-derived and make a malformed/ambiguous identity unresolved.
- [ ] Rerun the focused tests; expect all pass.
- [ ] Commit: `feat: add annual report extraction contracts`.

### Task 2: Add server-only PDF validation and native text provider

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `src/server/document-extraction/pdf-limits.ts`
- Create: `src/server/document-extraction/validate-pdf-upload.ts`
- Create: `src/server/document-extraction/native-pdf-text-provider.ts`
- Create: `src/server/document-extraction/types.ts`
- Test: `src/test/annual-report-pdf-validation.test.ts`
- Test: `src/test/annual-report-native-text-provider.test.ts`

**Interfaces:** Consumes uploaded `Uint8Array`; produces `DocumentTextExtractionProvider.extract({ bytes, limits }) -> { pageCount, pages }` with page mode `native_text` or `scanned_page_unsupported`.

- [ ] Add failing tests for PDF signature/MIME/size/page limits, malformed bytes, a native-text fixture, an image-only fixture, and mixed pages. Assert no OCR call/interface implementation is invoked.
- [ ] Run `npx vitest run src/test/annual-report-pdf-validation.test.ts src/test/annual-report-native-text-provider.test.ts`; expect failure before provider exists.
- [ ] Install direct dependency `pdfjs-dist@6.3.289`; implement the server-only provider with a 250-page cap, text-token cap, safe parser errors, and page-level text sufficiency classification. Define but do not instantiate an OCR-capable provider interface.
- [ ] Rerun focused tests; expect pass and no browser bundle imports.
- [ ] Commit: `feat: add native annual report PDF parsing`.

### Task 3: Implement layout, statement discovery, and candidate extraction

**Files:**
- Create: `src/features/annual-report-ingestion/lib/reconstruct-layout.ts`
- Create: `src/features/annual-report-ingestion/lib/discover-financial-statements.ts`
- Create: `src/features/annual-report-ingestion/lib/extract-row-candidates.ts`
- Test: `src/test/annual-report-layout.test.ts`
- Test: `src/test/annual-report-statement-discovery.test.ts`
- Test: `src/test/annual-report-row-candidates.test.ts`

**Interfaces:** Consumes `ParsedPdfPage[]`; produces `ReconstructedTable[]` and raw row candidates with label/value-cell coordinates, statement/scope/rank, header periods, scale, and currency context.

- [ ] Write failing tests for line/column reconstruction, primary-statement headings, consolidated preference, page number/header/footer exclusion, note-reference exclusion (`Revenue 5 4,725 4,381`), and current/prior column association.
- [ ] Run focused tests; expect missing modules.
- [ ] Implement deterministic coordinate grouping and heading/statement dictionaries. Preserve all raw tokens needed to support evidence; do not normalize financial values in this task.
- [ ] Rerun focused tests; expect pass.
- [ ] Commit: `feat: discover annual report financial statements`.

### Task 4: Map, normalize, rank, and derive candidates without invention

**Files:**
- Create: `src/features/annual-report-ingestion/lib/normalize-financial-value.ts`
- Create: `src/features/annual-report-ingestion/lib/map-candidates.ts`
- Create: `src/features/annual-report-ingestion/lib/derive-financial-fields.ts`
- Create: `src/features/annual-report-ingestion/lib/validate-extraction.ts`
- Create: `src/features/annual-report-ingestion/lib/build-extraction-draft.ts`
- Test: `src/test/annual-report-normalization.test.ts`
- Test: `src/test/annual-report-candidate-selection.test.ts`
- Test: `src/test/annual-report-derivations.test.ts`
- Test: `src/test/annual-report-reconciliation.test.ts`

**Interfaces:** Produces `buildExtractionDraft(input): ExtractionDraft`; it returns all candidates and a sparse draft but never `FinancialAnalysisInput`.

- [ ] Write failing tests for scale normalization, parentheses/trailing-minus, dash/blank rejection, supported currency, primary-statement ranking, equal-rank conflict, ambiguous EBIT, net-debt rejection, high/medium/low policy, total-debt aggregation, all three working-capital average dependencies, and failed reconciliation preserving source values.
- [ ] Run focused tests; expect failure.
- [ ] Implement normalizer, mapping/ranking, derivation registry, reconciliation diagnostics, and draft builder. A medium candidate must retain evidence but leave draft `formValue` empty until accepted; a direct high candidate auto-fills only with evidence.
- [ ] Rerun focused tests; expect pass and assert `unsupportedAutoFilledCount === 0`.
- [ ] Commit: `feat: build evidenced annual report extraction drafts`.

### Task 5: Add draft persistence schema, repository, and migration coverage

**Files:**
- Modify: `src/server/db/schema.ts`
- Modify: `src/server/repositories/backend-repository.ts`
- Create: `src/server/document-extraction/extraction-repository-types.ts`
- Create: `drizzle/<generated migration files>`
- Test: `src/test/backend-document-extraction-persistence.test.ts`
- Modify: `src/test/backend-schema.test.ts`

**Interfaces:** Produces repository methods `createExtractionRun`, `markExtractionProcessing`, `completeExtractionRun`, `failExtractionRun`, `createCandidates`, `upsertDraftField`, `getExtractionRunForWorkspace`, `listExtractionRunsForWorkspace`, and `linkExtractionToDatasetVersion`.

- [ ] Write failing backend tests for schema migration, run/candidate/draft round trip, unique draft field per key/slot, original candidate retained after override, no synthetic fiscal year in slots, reprocessing preserving old runs, and cross-workspace lookups returning no record after authorization.
- [ ] Run `npm run db:test`; expect failure because tables/methods do not exist.
- [ ] Add enums/tables/indexes/foreign keys from the data-model section, repository methods, then run `npm run db:generate` to create the migration. Do not modify dataset-version tables or canonical statement rows.
- [ ] Rerun `npm run db:test`; expect pass. Inspect generated SQL and run `git diff --check`.
- [ ] Commit: `feat: persist annual report extraction drafts`.

### Task 6: Create authorized ingestion service and private-byte boundary

**Files:**
- Modify: `src/server/storage/types.ts`
- Modify: `src/server/storage/supabase-storage-service.ts`
- Modify: `src/server/services/file-service.ts`
- Create: `src/server/services/document-extraction-service.ts`
- Modify: `src/server/accounts/account-context.ts`
- Test: `src/test/backend-document-extraction-service.test.ts`
- Modify: `src/test/backend-file-service.test.ts`

**Interfaces:** Adds server-only `StorageService.download(key): Promise<Uint8Array>` and `DocumentExtractionService.uploadAndExtract(actorUserId, workspaceId, input)`, `getDraft`, `acceptCandidate`, `overrideField`, `retry`, and `confirmDraft`.

- [ ] Write failing tests for uploader/member/viewer behavior, foreign-workspace file/run denial, PDF-only upload, signature failure, storage download authorization, safe parser failure, retry, activity events, signed source access, and immutable confirmation link.
- [ ] Run `npm run db:test`; expect failure.
- [ ] Implement service authorization before every entity lookup, call existing `FileService` with private storage, retrieve bytes only server-side, execute pure pipeline, persist all candidates/drafts, and expose signed URLs only through an authorized method. Require accepted/manual/high values before `confirmDraft` builds form values and delegates to existing `FinancialDatasetService` then `AnalysisHistoryService`.
- [ ] Rerun backend tests; expect pass. Run `npm run db:check` and `npm run db:live:check` only after migration review approval.
- [ ] Commit: `feat: add authorized annual report extraction service`.

### Task 7: Add server actions and authenticated/anonymous entry boundary

**Files:**
- Create: `src/app/input/actions.ts`
- Modify: `src/app/input/page.tsx`
- Create: `src/features/annual-report-ingestion/components/annual-report-entry.tsx`
- Create: `src/features/annual-report-ingestion/components/annual-report-upload.tsx`
- Create: `src/features/annual-report-ingestion/components/annual-report-processing.tsx`
- Test: `src/test/annual-report-entry.test.tsx`
- Test: `src/test/annual-report-upload.test.tsx`

**Interfaces:** `startAnnualReportExtractionAction(FormData)` returns `{ status, runId?, message }`; `AnnualReportEntry` accepts public/authenticated view models, never a storage client.

- [ ] Write failing UI/action tests for anonymous sign-in/create-account gate with fixed return path `/input?ingest=annual-report`, authenticated drag/drop upload, keyboard file selection, honest stage states, unsupported-document fallback, and manual-entry escape.
- [ ] Run focused tests; expect failure.
- [ ] Implement server actions that resolve account/workspace server-side and only accept a `File`; validate the fixed return target. Add entry/upload/processing components using existing V2 tokens, no change to unrelated navigation or shell.
- [ ] Rerun focused tests; expect pass.
- [ ] Commit: `feat: add annual report upload entry flow`.

### Task 8: Integrate extraction draft review into Financial Input

**Files:**
- Modify: `src/features/financial-input/types.ts`
- Modify: `src/features/financial-input/form-transform.ts`
- Modify: `src/features/financial-input/workflow.tsx`
- Create: `src/features/annual-report-ingestion/lib/extraction-draft-to-form.ts`
- Create: `src/features/annual-report-ingestion/components/extraction-summary.tsx`
- Create: `src/features/annual-report-ingestion/components/field-provenance.tsx`
- Create: `src/features/annual-report-ingestion/components/source-detail.tsx`
- Test: `src/test/annual-report-financial-input-review.test.tsx`
- Modify: `src/test/financial-input-workflow.test.tsx`

**Interfaces:** `extractionDraftToForm(draft): { values: FinancialInputFormValues; sidecar: ExtractionReviewSidecar }`. `sidecar` is noncanonical metadata keyed by `periods.{slot}.{section}.{field}`.

- [ ] Write failing component tests for high-value fill, medium suggestion acceptance, low/conflict/not-found emptiness, `fiscalPeriod = null` display, source evidence display, editable PDF values, override preservation, unchanged PDF confirmation retaining provenance, and analysis blocked by the pre-existing canonical validation for an empty period.
- [ ] Run focused tests; expect failure.
- [ ] Implement the extraction sidecar without adding provenance fields to `FinancialAnalysisInput`. The workflow initializes the one RHF instance from draft strings, keeps labels visible, opens signed source detail on demand, persists user resolutions through actions, and invokes existing canonical transformation unchanged at submit.
- [ ] Rerun focused and Financial Input regression tests; expect pass.
- [ ] Commit: `feat: review extracted annual report values in financial input`.

### Task 9: Implement corpus fixtures, extraction harness, and iterative correction loop

**Files:**
- Create: `src/test/fixtures/annual-reports/*.ground-truth.json`
- Create: `src/test/fixtures/annual-reports/README.md`
- Create: `src/test/annual-report-real-corpus.test.ts`
- Create: `scripts/validate-annual-report-corpus.ts`
- Modify: `package.json`
- Create: `docs/annual-report-pdf-ingestion.md`

**Interfaces:** `npm run test:annual-reports` retrieves/uses a locally cached report under a deliberate command, verifies checksum, runs extraction, and prints the accuracy table without logging report text.

- [ ] Write failing corpus tests with one manually verified normalized field/page per report before adding broader ground truth. Add fixtures that explicitly mark intentionally absent fields and scanned-page expectations.
- [ ] Run `npm run test:annual-reports`; expect fixture/harness failure.
- [ ] Implement source retrieval/cache rules, checksum validation, fixture parser, exact comparison, metrics table, and zero-unsupported assertion. Populate reviewed ground truth through the two-pass methodology, then rerun the full corpus after each general parser correction.
- [ ] Rerun corpus and retain every validated fixture as regression evidence; expect `unsupported = 0` for each report.
- [ ] Commit: `test: add annual report extraction validation corpus`.

### Task 10: Documentation, end-to-end QA, migration validation, and release gate

**Files:**
- Modify: `docs/backend/accounts-and-persistence-architecture.md`
- Modify: `docs/backend/frontend-integration-contract.md`
- Modify: `docs/methodology.md`
- Modify: `README.md` only if its feature/status section needs a factual update
- Modify: `docs/annual-report-pdf-ingestion.md`
- Test: `src/test/backend-integration-contract.test.ts`

**Interfaces:** Documents the final user/security/persistence/extraction contract; no new production interface is introduced here.

- [ ] Write/adjust failing contract tests for draft isolation, no public URL, no browser privileged storage, canonical confirmation lineage, and invariant enforcement.
- [ ] Run focused contract tests; expect failure before documentation-aligned behavior exists.
- [ ] Document pipeline, aliases/exclusions, confidence/review distinction, derivations, period slots, OCR/AI V1 exclusion, security limits, corpus protocol, accuracy results, and known limitations. Do not claim readiness unless corpus evidence is complete.
- [ ] Run `npm run typecheck`, `npm run lint`, `npm run test`, `npm run db:test`, `npm run test:annual-reports`, `npm run build`, `npm run db:generate`, `npm run db:migrate`, `npm run db:check`, `npm run db:live:check`, and `git diff --check`; restore `next-env.d.ts` from `main` if Next rewrites it.
- [ ] Perform manual product QA: authenticated PDF upload -> processing -> review -> source -> override -> confirm -> analysis/ratios/DuPont/scenario; anonymous sign-in gate; invalid PDF; foreign-workspace authorization; desktop and 320px. Record results and commit: `docs: document annual report ingestion validation`.

## Test Matrix

| Layer | Required assertions |
| --- | --- |
| Pure parser | PDF signature/limits, native/scanned detection, tokens, layout, table headers, footer/note exclusion, years, units, currency, negative forms |
| Semantic mapping | all canonical aliases, exclusions, scope preference, duplicates, conflict, source priority, no company-specific rule |
| Draft/canonicalization | evidence mandatory, high fill, medium explicit acceptance, low/unknown empty, provenance/review independence, empty periods, no zero fallback |
| Derivations | total debt component inclusion, no net debt, each average's two closing periods, missing opening balance unresolved, component evidence retained |
| Accounting checks | tolerance, signal-only differences, no source mutation, compatible cross-statement comparison |
| Persistence | migration, run/version lineage, candidates, resolutions, override preservation, retry/reprocessing, immutable dataset link |
| Authorization/storage | owner/admin/member/viewer permissions, tenant isolation, storage key isolation, signed URL authorization, private byte retrieval, no anonymous processing |
| UI | sign-in gate, upload/drop/keyboard, processing/error states, summary, badges, source detail, manual values, overrides, form validation, 320px structure |
| Real corpus | exact normalized ground truth, expected absence, three/two periods, USD/EUR/GBP, SEC/IFRS/Spanish/UK, consolidated/parent, scales, negatives, mixed scanned/native, unsupported=0 |
| Existing regression | NovaTech, Atlas, manual input, canonical parser, persistent dataset/analysis, ratio, DuPont, scenario outputs unchanged |

## Implementation Sequence and Review Gates

1. Tasks 1-4 form the pure parser/mapping gate. Do not add UI or database schema until synthetic parser and no-invention tests pass.
2. Tasks 5-6 form the persistence/authorization gate. Review generated SQL and PGlite tests before live migration.
3. Tasks 7-8 form the user-review gate. Review at desktop/mobile before linking confirmation to a dataset version.
4. Task 9 is the real-document gate. Iterate general rules and rerun every corpus item after each correction; stop rather than claim readiness if unsupported values appear.
5. Task 10 is the release gate. No merge, push, or readiness statement until every required validation and manual QA item passes.

## Expected File-Change Map

**Existing files likely modified:**

- `package.json`, `package-lock.json`
- `src/app/input/page.tsx`, `src/app/input/actions.ts` (new action file)
- `src/features/financial-input/types.ts`, `form-transform.ts`, `workflow.tsx`
- `src/server/db/schema.ts`, `src/server/repositories/backend-repository.ts`
- `src/server/storage/types.ts`, `supabase-storage-service.ts`
- `src/server/services/file-service.ts`, `src/server/accounts/account-context.ts`
- `src/app/workspace/actions.ts` only if the shared file action needs a safe extraction handoff
- `docs/backend/accounts-and-persistence-architecture.md`, `docs/backend/frontend-integration-contract.md`, `docs/methodology.md`

**New directories/files:**

- `src/features/annual-report-ingestion/{types.ts,lib/**,components/**}`
- `src/server/document-extraction/**`
- `src/server/services/document-extraction-service.ts`
- `src/test/annual-report-*.test.ts[x]`
- `src/test/fixtures/annual-reports/**`
- `scripts/validate-annual-report-corpus.ts`
- `docs/annual-report-pdf-ingestion.md`
- generated `drizzle/**` migration files

No high-risk deterministic-engine module should change. If an implementation requires changing a financial formula, `FinancialAnalysisInput`, scoring, DuPont, scenarios, or a confirmed dataset value, stop and raise an architecture deviation.

## Completion Criteria

- Real annual-report corpus has been run and recorded.
- Each auto-filled number has evidence or a fully evidenced declared derivation; unsupported is zero.
- Missing and medium/conflict values remain unresolved until explicit user action.
- Three-period slots behave correctly with actual fiscal labels and no synthetic years.
- Workspace/file/provenance isolation and signed URL access pass two-user tests.
- Override and confirmation lineage preserve original candidates and existing immutability.
- NovaTech, Atlas, and manual workflows retain existing results.
- Typecheck, lint, all tests, DB tests, corpus suite, build, migration, live checks, and `git diff --check` pass.

## Architecture deviations required before implementation

None.
