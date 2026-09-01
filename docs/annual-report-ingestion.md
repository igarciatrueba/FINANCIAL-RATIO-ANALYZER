# Annual Report PDF Ingestion V1

EQUIVERSE can prepare a Financial Input review draft from a private annual-report PDF for authenticated workspace members. It is a parser-first workflow, not an OCR or AI extraction service.

## Trust Boundary

Every canonical financial number submitted from this workflow must originate from one of the following:

1. direct PDF evidence;
2. an explicit user-provided or user-accepted value; or
3. a documented deterministic derivation from evidenced inputs.

Otherwise the field remains unresolved. The Financial Input form remains the only strings-to-canonical-parser boundary; PDF extraction never bypasses `parseFinancialAnalysisInput()`.

## Private Lifecycle

`Authenticated user -> private Storage upload -> workspace-authorized extraction -> review draft -> canonical Financial Input -> immutable imported dataset -> analysis`

The browser never receives Storage keys or privileged credentials. Opening a source document asks the server for an authorized, short-lived signed URL. Workspace checks apply to upload, extraction, review, source access and confirmation.

Anonymous users retain manual Financial Input. They can see the annual-report capability, but must sign in before a PDF selector or upload is available.

## Periods and Provenance

The canonical model still requires exactly three periods. A two-period report produces a three-slot draft with an empty `fiscalPeriod = null` slot. The application never invents, extrapolates, shifts or retrieves a missing fiscal year.

Provenance is separate from review state:

- `PDF_EXTRACTED`, `USER_PROVIDED`, `USER_OVERRIDE`, `DERIVED`, `NOT_FOUND`, `CONFLICT`
- `UNREVIEWED`, `NEEDS_REVIEW`, `USER_CONFIRMED`

A user confirmation keeps an unchanged direct value as `PDF_EXTRACTED`. An override retains the original PDF candidate/evidence and changes the current field to `USER_OVERRIDE`.

High-confidence direct values may populate the editable form. Medium-confidence candidates remain empty until explicitly accepted. Low-confidence, conflicting, unavailable and unsupported values remain empty.

## Native Parsing Scope

V1 uses `pdfjs-dist` native text extraction with request limits and layout reconstruction. A page with no usable embedded text is recorded as `scanned_page_unsupported`. No local OCR, provider credential, remote OCR/AI call or guessed value exists in V1.

The parser accepts only structural financial-statement headers and exact approved accounting aliases. It rejects narrative references, reconciles statement scope, preserves source page/label/value/coordinates, and refuses cross-statement mapping. For example, a working-capital movement in cash flow cannot become an accounts-receivable balance. Expense, liability, debt and capital-expenditure values are normalized to the positive canonical magnitude expected by the Financial Input contract; the source-display sign remains in evidence.

`Total Debt` is derived only from every evidenced included current debt component plus an evidenced non-current debt component. It never uses net debt, a partial component set or an accounting-equation inference. Each component retains its own evidence reference. Working-capital averages remain unresolved unless both required opening and closing balances are evidenced.

Mixed or multi-column layouts that cannot be defensibly separated remain unsupported rather than generating partial automatic values.

## Corpus Validation

The repository contains source URLs, checksums and manually transcribed ground truth only; copyrighted PDFs are not committed. Ground truth is established from the audited report, independently of extractor output. The fixture materializes all 54 canonical field/period slots and classifies each as `PRESENT_DIRECT`, `PRESENT_DERIVABLE`, `NOT_PRESENT` or `AMBIGUOUS`.

Every direct value records the normalized canonical value, fiscal period, currency, scale, PDF page, statement and source label. Every derivation records its deterministic rule and all source components. A value is not marked present merely because the extractor happened to return it.

Cache the approved primary-source PDFs locally and run:

```bash
EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR=/path/to/corpus npm run test:annual-reports
```

The harness verifies SHA-256 before extraction and fails if an automatically populated value is incorrect or unsupported. It reports separately:

- canonical values present in the PDF and safely obtainable;
- correctly auto-filled values;
- candidate values requiring review;
- present-but-missed values;
- genuinely not-present and ambiguous values;
- incorrect and unsupported auto-filled values;
- precision: correct auto-filled / all auto-filled; and
- recall: correctly resolved supported values / canonical values present and safely obtainable.

It does not download PDFs or print report text. A second explicit live validation runs the private authenticated lifecycle against the configured Supabase project:

```bash
EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR=/path/to/corpus npm run test:annual-report-live
```

It creates and removes an isolated test identity, workspace, uploaded objects and database records. It validates private upload, native extraction, evidence inspection, a missing-field value, an override retaining evidence, immutable dataset confirmation, persisted analysis and a two-year report's unresolved period slot.

Current validated corpus:

- Microsoft 2024 annual report: native-text US GAAP structure.
- Siemens 2024 annual report: IFRS structure and evidenced debt components.
- Inditex 2024 consolidated annual accounts: mixed fiscal-label/date headers. Its audited statements contain substantially more canonical evidence than the safe draft currently resolves.
- Diageo 2024 annual report: multi-column mixed layout. The audited statements contain 36 safely obtainable canonical values in the ground truth; the V1 parser intentionally auto-fills none until the layout can be separated defensibly.

The native PDF library may issue font-function warnings for some documents; they are isolated parser-library diagnostics and do not alter the extraction result or evidence policy.
