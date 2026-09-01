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

The parser accepts only structural financial-statement headers and exact approved accounting aliases. It rejects narrative references, reconciles statement scope, preserves source page/label/value/coordinates, and refuses cross-statement mapping. For example, a working-capital movement in cash flow cannot become an accounts-receivable balance.

`Total Debt` is derived only from evidenced current and non-current debt components. It never uses net debt, a partial component set or an accounting-equation inference. Working-capital averages remain unresolved unless both required opening and closing balances are evidenced.

Mixed or multi-column layouts that cannot be defensibly separated remain unsupported rather than generating partial automatic values.

## Corpus Validation

The repository contains source URLs, checksums and manually verified allowed-field expectations only; copyrighted PDFs are not committed. Cache the approved primary-source PDFs locally and run:

```bash
EQUIVERSE_ANNUAL_REPORT_CORPUS_DIR=/path/to/corpus npm run test:annual-reports
```

The harness verifies SHA-256 before extraction and fails if a ground-truth expected field is wrong or an unapproved field is automatically populated. It does not download PDFs or print report text.

Current validated corpus:

- Microsoft 2024 annual report: native-text US GAAP structure.
- Siemens 2024 annual report: IFRS structure and evidenced debt components.
- Inditex 2024 consolidated annual accounts: mixed fiscal-label/date headers, retained as a sparse safe draft.
- Diageo 2024 annual report: multi-column mixed layout; intentionally no automatic values in V1.

The native PDF library may issue font-function warnings for some documents; they are isolated parser-library diagnostics and do not alter the extraction result or evidence policy.
