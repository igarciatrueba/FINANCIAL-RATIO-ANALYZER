# EQUIVERSE Annual Report PDF Ingestion V1 Design

**Status:** Approved design, pending implementation plan

## Purpose

Allow an authenticated workspace member to upload a private annual-report PDF,
extract only defensibly supported financial values, review them in the existing
Financial Input workflow, and create a normal immutable dataset version only
after explicit confirmation. The existing canonical parser and deterministic
analysis engine remain unchanged.

## Governing invariant

Every canonical financial number must originate from exactly one of:

1. direct PDF evidence;
2. an explicit user-provided or user-accepted value; or
3. a documented deterministic derivation from evidenced inputs.

Otherwise it remains unresolved. No component may estimate, interpolate,
retrieve, synthesize, or use world knowledge to populate a financial input.

## Scope

### Included

- Authenticated upload to existing private workspace storage.
- Native-text PDF parsing and layout-aware financial-statement extraction.
- Statement discovery, consolidated-scope preference, fiscal-period, currency,
  scale, sign, table-row, and source-priority handling.
- Explicit canonical-field aliases and exclusions.
- Evidence, confidence, conflict, reconciliation, and user-review metadata.
- An editable Financial Input review state with field-level provenance.
- Durable extraction drafts, provenance, overrides, diagnostics, retry, and
  future reprocessing lineage.
- A public annual-report validation corpus with verified ground truth.

### Excluded from V1

- OCR implementation, OCR dependencies, OCR infrastructure, or provider keys.
- External LLM/document-extraction providers and model-generated values.
- Anonymous upload, anonymous temporary document processing, or public files.
- Automatic retrieval or merging of multiple reports.
- Invention of fiscal years, financial values, taxes, expenses, debt, or
  averages.
- Changes to canonical financial schemas, ratios, scoring, DuPont, scenarios,
  existing demo data, or confirmed dataset immutability.

## User and storage boundary

The V1 lifecycle is deliberately authenticated and tenant-scoped:

```text
Authenticated user
  -> authorized workspace
  -> private PDF upload
  -> extraction draft
  -> Financial Input review
  -> explicit confirmation
  -> existing immutable dataset version
  -> existing analysis engine
```

The browser never reads raw storage paths or uses a privileged Supabase client.
Upload, byte retrieval for parsing, provenance inspection, retry, and signed
source links are server-mediated after workspace authorization. An anonymous
user can see the annual-report entry point but must sign in or create an
account; manual Financial Input remains available without authentication.

## Canonical boundary and period slots

`FinancialAnalysisInput` remains the only accepted input to the existing
analysis pipeline. Extraction produces a separate, sparse draft model first.

The canonical model requires three chronological annual periods. An uploaded
report may provide fewer. Extraction therefore uses three **slots**, each with
an optional source fiscal period:

```ts
type ExtractionPeriodSlot = {
  slotIndex: 0 | 1 | 2;
  fiscalPeriod: { label: string; year?: number; endDate?: string } | null;
  resolution: "resolved" | "manual_input_required";
};
```

For a report with FY2025 and FY2024 only:

```text
slot 1: fiscalPeriod = null, manual_input_required
slot 2: FY2024
slot 3: FY2025
```

`Period 1` is display-only terminology. It is never persisted as an invented
fiscal year, never passed to the canonical parser as a year, and never used to
shift source data into an assumed year. The review UI preserves detected source
labels and marks the empty slot as requiring manual input.

Analysis remains governed by the existing canonical parser. The ingestion
feature does not invent a looser analysis path for incomplete data.

## Evidence, provenance, confidence, and review are separate concepts

### Provenance type

Each draft field has one current provenance type:

```text
PDF_EXTRACTED
USER_PROVIDED
USER_OVERRIDE
DERIVED
NOT_FOUND
CONFLICT
```

`PDF_EXTRACTED` remains the provenance after a user reviews or confirms an
unchanged extracted value. `USER_PROVIDED` means no extracted value exists.
`USER_OVERRIDE` preserves the original PDF candidate and records the new
authoritative user value. `DERIVED` records every input used by a documented
deterministic rule. `NOT_FOUND` and `CONFLICT` have no current numeric value.

### Review state

Review is independent from provenance:

```text
UNREVIEWED
NEEDS_REVIEW
USER_CONFIRMED
```

This avoids treating an unchanged PDF value as manual merely because the user
reviewed it. A user may confirm a high-confidence `PDF_EXTRACTED` value;
provenance remains `PDF_EXTRACTED`, review becomes `USER_CONFIRMED`.

### Evidence record

Every direct candidate retains at least:

```ts
type SourceEvidence = {
  fileId: string;
  pageNumber: number;
  extractionMode: "native_text" | "scanned_page_unsupported";
  statement: string | null;
  statementScope: "consolidated" | "parent" | "unknown";
  sourceRank: "primary_statement" | "reconciling_note" | "official_table" | "management_kpi" | "narrative";
  sourceLabel: string;
  rawValue: string;
  context: string;
  fiscalPeriod: { label: string; year?: number; endDate?: string } | null;
  currency: string | null;
  scale: "units" | "thousands" | "millions" | "billions" | "unknown";
};
```

The normalized value, parser diagnostics, confidence, and field mapping are
stored separately from the raw evidence. Evidence is required for every PDF
number; lack of evidence rejects automatic population.

### Confidence policy

- **High:** unambiguous native-text evidence from a preferred consolidated
  statement, with matched period, scale, and currency. It may auto-fill the
  editable Financial Input field as `PDF_EXTRACTED` and `UNREVIEWED`.
- **Medium:** supported candidate with evidence but semantic, source-priority,
  or reconciliation ambiguity. It is displayed as a suggestion with source
  detail and `NEEDS_REVIEW`; it cannot become a canonical field value until
  the user explicitly accepts or edits it.
- **Low, conflict, unsupported, or absent:** no numeric auto-fill. The field
  remains empty and requests manual input or candidate resolution.

No confidence value is a permission to fabricate data.

## Extraction pipeline

```text
private PDF bytes
  -> format and resource validation
  -> native PDF text/layout extraction
  -> page capability classification
  -> statement and scope discovery
  -> table/row/column candidate discovery
  -> semantic canonical mapping
  -> value normalization
  -> candidate ranking and conflict detection
  -> deterministic reconciliation signals
  -> sparse extraction draft
  -> editable Financial Input review
```

### Native-text handling and future OCR boundary

The parser first evaluates usable embedded text on every page. A page without
usable text is classified `scanned_page_unsupported`. The V1 extractor uses
only native-text pages in a mixed document and records unresolved fields
normally. It never automatically OCRs, guesses, or fills values from scanned
pages.

An internal `DocumentTextExtractionProvider` boundary will return page-level
text/layout and an extraction mode. V1 provides only the native implementation;
future OCR can implement the same interface without changing mapping,
provenance, review, or canonical boundaries.

### Statement and source selection

The system detects Income Statement / Profit or Loss, Balance Sheet / Financial
Position, Cash Flow Statement, and related equity statements. It prefers a
consistent consolidated statement set. Candidate ranking is:

1. audited consolidated primary statements;
2. audited notes directly reconciling the statement;
3. official financial tables;
4. management KPI tables;
5. narrative text.

Candidates from different scopes cannot be silently combined. Ambiguous scope,
duplicate candidates of comparable rank, or conflicting normalized values lead
to `CONFLICT` or `NEEDS_REVIEW`, not arbitrary selection.

### Normalization

Native parser output is normalized only after evidence is retained. The
normalizer handles declared units, thousands, millions, billions, supported
currency, leading minus, trailing minus, and parentheses. A dash, em dash,
blank, N/A, page number, note reference, or malformed number does not default
to zero. Fiscal periods come from headers and report context, not an assumed
calendar year.

### Canonical mapping

A versioned configuration will map every actual Financial Input field to
explicit accepted labels, aliases, statement types, and forbidden lookalikes.
It covers income statement, balance sheet, cash flow, and working-capital
inputs. Examples of explicit non-equivalences include:

- EBITDA is never EBIT.
- Net debt is never total debt.
- Current assets are never working capital.
- Operating cash flow is never free cash flow.

The mapping configuration, not component text, is the sole semantic mapping
source. Tests cover aliases, exclusions, and ambiguous labels.

### Aggregation and derivation

`AGGREGATED` is represented as `DERIVED` with `derivationKind = aggregation`.
It is allowed only when the canonical accounting definition and every source
component make the operation valid. For example, total debt can be summed only
from explicitly evidenced debt components that the mapping configuration marks
as included in canonical total debt. It never substitutes net debt.

Working-capital averages use a documented average-balance rule only when both
the relevant opening and closing balances are evidenced. In a two-year report,
an average for the earlier presented year can require an unavailable prior
opening balance; it must remain unresolved. Derived/aggregated values retain
all component evidence and never masquerade as direct PDF facts.

### Validation and reconciliation

Validation produces review signals, never repairs values. It may check balance
sheet reconciliation when assets, total liabilities, and equity are all
evidenced, and may check compatible cross-statement relationships. It records
tolerance, inputs, and outcome. A failed check lowers confidence or creates a
conflict; it never alters a value or fills a missing field.

## Persistence and lineage

New persistence is intentionally draft-oriented and separate from confirmed
financial datasets:

- an extraction run linked to the existing private `files` record, workspace,
  optional company, engine version, status, timestamps, document summary, and
  safe failure details;
- per-field candidates and source evidence, including rejected candidates and
  concise diagnostics;
- per-field user resolution/acceptance/override records;
- a sparse review-draft snapshot with period slots and processing summary.

The exact table names will follow repository conventions. Confirmed canonical
versions continue using the existing immutable dataset-version flow and source
type `import`; extraction lineage links to that version without modifying it.
Reprocessing keeps previous runs intact and creates a new draft using a newer
extraction engine version. Raw provider reasoning is never stored.

## Financial Input experience

Financial Input receives form strings plus an extraction sidecar; it does not
receive an unvalidated `FinancialAnalysisInput`. The current explicit
string-to-number-to-canonical-parser pipeline remains intact.

The review experience includes a document summary, status counts, subtle
provenance badges, field-level source detail, medium-confidence acceptance,
manual override, and unresolved prompts. All values remain editable. Accepting
or editing a suggestion is explicit. Analysis is never auto-run after upload.

On parser failure or unsupported document, the uploaded file may remain in the
private workspace for retry, while the user can return to manual entry without
being trapped.

## Security and operational limits

- Server validates MIME, PDF signature, filename, size, authorization, page
  count, parser output limits, and failure modes before/while parsing.
- No shell execution, external document execution, public URL, browser access
  to privileged storage, OCR, or AI provider is used in V1.
- Parser errors are converted to safe product errors; source content is not
  logged. Observability records durations, page count, field counts, conflicts,
  missing fields, and safe failure categories.
- Retry is bounded and records a fresh extraction run without overwriting a
  prior result.
- Future AI/OCR adapters must treat PDF text as untrusted data and return
  schema-validated evidence only; they may not follow document instructions or
  introduce numerical facts without source evidence.

## Validation corpus and quality gates

The implementation will use several primary-source public annual reports
covering SEC-style USD, IFRS EUR, Spanish-listed EUR, and UK GBP layouts, with
documented source URLs and accounting/report styles. Verified, normalized
ground-truth fixtures will identify source pages and expected field values;
full PDFs will not be committed where licensing is unsuitable.

For every corpus report, the validation report records expected, auto-filled,
correct, review, missing, incorrect, and unsupported fields. Unsupported must
be zero. The corpus covers units, currencies, negatives, year columns,
consolidated/parent statements, multiple candidates, absent fields, table
complexity, and scanned or mixed-page behavior.

## Test strategy

Tests precede implementation and cover:

- PDF/security/resource validation and native/scanned classification;
- layout reconstruction, year/scale/currency/sign parsing, and note-reference
  exclusion;
- aliases, forbidden mappings, scope preference, duplicates, and conflicts;
- evidence-required acceptance, confidence policy, aggregation, derivation,
  and reconciliation signals;
- empty canonical slot behavior for two-year reports;
- authenticated authorization, workspace isolation, signed source access,
  drafts, retry, reprocessing, and immutable confirmation lineage;
- Financial Input review, explicit medium-candidate acceptance, manual
  overrides, source display, failures, and anonymous sign-in gate;
- real-corpus exact normalized values and a zero-unsupported-value audit;
- full existing engine regressions for manual, NovaTech, and Atlas flows.

## Acceptance checklist

- No auto-populated number lacks direct evidence or an evidenced deterministic
  derivation.
- Medium confidence never silently becomes canonical.
- Empty period slots never become synthetic fiscal periods.
- User confirmation does not change an unchanged PDF field to manual.
- Overrides retain original evidence and value.
- Derived/aggregated values declare their rule and complete source set.
- PDF drafts cannot weaken immutable dataset versioning or tenant isolation.
- Existing canonical parser and financial engine receive only confirmed valid
  input and preserve their current outputs.
