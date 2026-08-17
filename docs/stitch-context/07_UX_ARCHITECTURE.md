# Current UX Architecture and Redesign Opportunities

## Navigation and journeys

The primary journey is Landing -> Financial Input -> Executive Dashboard -> Ratio/DuPont drill-down or Scenario Lab -> Methodology. Engine Map is an educational product-architecture route. The baseline shell exposes top navigation for analytical pages; Input uses a six-step workflow. Analysis routes require a valid active session, while Landing, Input, Engine Map, and Methodology do not.

## Information levels

- **Executive view:** score/classification, coverage, diagnosis, principal insights, and KPIs answer "what condition is this company in?".
- **Analyst view:** registered ratios, formula metadata, three-year trends, bridges, working capital, dimension score/coverage, and drivers answer "why?".
- **Methodology view:** formula registry, score anchors/weights, assumptions and limitations answer "can I trust and reproduce this?".
- **Experiment view:** Scenario Lab changes inputs/assumptions and compares the result, not an editable score.

## Existing patterns to preserve functionally

- current/prior values are visible together;
- unavailable values are explicit and reasoned;
- context bars identify company, period, currency, coverage or scenario;
- details/summary elements expose formulas and methodology without forcing all details into view;
- tables retain semantic headings and local overflow;
- page states offer return routes rather than silent fallback.

## Opportunities for V3 (not design instructions)

1. **Input flow:** clarify period columns and validation locality while retaining all labels, field access, free navigation, and review links.
2. **Executive narrative:** make score, diagnostic evidence, and principal insights sequentially understandable before charts without dropping detail.
3. **Analyst exploration:** connect ratio selection, table inspection, trend history and formula disclosures while preserving registry metadata and unavailable states.
4. **Scenario clarity:** visually distinguish Base Case values, assumptions, transformed statement fields, and analytical outputs; do not imply a forecast or full accounting reconciliation.
5. **Engine Map:** make upstream/downstream relationships legible without creating fake architecture or turning it into an analysis screen.
6. **Responsive density:** preserve order and meaning on mobile rather than merely compress desktop grids.

## Accessibility constraints

One clear page heading; semantic section headings; visible focus; keyboard controls; non-colour state; screen-readable chart summaries; live loading messages; alert errors; logical mobile reading order; reduced motion. These are functional quality constraints, not optional decoration.
