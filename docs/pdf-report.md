# Independent executive PDF report

The existing download button lazy-loads `features/pdf-report/download-report`.
It passes the current `ExecutiveDashboardViewModel`, without re-running analysis,
reading storage, calling an API, or rendering dashboard components.

`report-document.ts` owns the A4 document, Roboto typography (bundled in pdfmake),
flow layout, repeating table headers and page-number footer. `report-charts.ts`
owns vector-only paper graphics. Its arithmetic is limited to coordinate scales
and cumulative waterfall positioning of bridge movements already present in the
view model. It does not calculate ratios, classify scores or generate insights.

pdfmake 0.2.23 and its embedded fonts are loaded only after the export action.
No CDN, external font request, server persistence or `window.print()` is used.
The existing web print stylesheet remains untouched for ordinary browser printing.
The export preserves the button label and appearance. Duplicate clicks are ignored
while an export is running, and failures are announced and allow retry.

## Report contract

- Financial text uses the VM's existing formatted values and explanations.
- The ratio trend uses the VM's deterministic default metric, disclosed in the PDF;
  transient selections inside the dashboard are not part of the VM contract.
- Missing chart observations are omitted, not converted to zero or interpolated.
- Full, partial and unavailable profitability bridges retain their VM disclosure.
- No inferred expenses, taxes or reconciliation values are introduced.
- Rows are kept intact; headings are kept with subsequent content. Long prose can
  flow across pages instead of being clipped. Sections start on deliberate pages;
  length is not hard-limited to nine pages.
- Company names longer than 100 characters are shown in full in the opening
  section; compact footers refer to that section rather than truncating the name.
- Output is selectable text and vector graphics, but is not a tagged PDF/UA file.
  Numeric movements preserve the application VM's units, including its existing
  percentage-delta formatting. Correcting that upstream convention is separate work.

## Reproducible QA

`node --import tsx scripts/generate-pdf-report-samples.ts /tmp/equiverse-pdf-qa --stress`

This offline script emits both real demos and their exact source view models.
Optional stress fixtures exercise long text/amounts, unavailable ratios/score,
missing statement bridge and GBP formatting; these are explicitly QA-only data.
It never persists or modifies application/demo data.

Render each PDF with `pdftoppm` and inspect every page. Compare extracted text
against source VM values as well as page bounds. Unit tests cover the VM boundary,
geometry, unavailable points, currencies and download interaction. Verify the web
before/after with identical seeded session, viewport and reduced-motion settings.

### Validation on 2026-09-28

- NovaTech and Atlas: nine A4 pages each, all pages rasterised and visually reviewed.
- Extracted report text checked against 149 NovaTech and 144 Atlas VM entries;
  none missing. No text outside the checked page bounds.
- Corrected sparse overflow pages, a trend-label/axis collision, split large
  monetary values and orphaned insight evidence during the render/review loop.
- Long-content stress fixture: eleven pages, without clipping or lost digits.
  Unavailable/GBP fixture: nine pages with explicit empty chart states.
- Real browser download tested against the production build. PDF/font chunks
  were absent before clicking; no browser execution errors were observed.
- Desktop web screenshot before/after: identical at 1440px, including the button.
- Typecheck, lint and build passed. Lint retains six pre-existing warnings outside
  this change. All 337 tests passed (282 application/domain, 55 backend), including
  thirteen new report tests. Generated `next-env.d.ts` was restored.
- No production deployment or commit performed.
