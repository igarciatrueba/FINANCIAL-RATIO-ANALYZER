# Current Design System and Typography

## Typography — PRESERVE BY DEFAULT IN FRONTEND V3

**Primary font:** `Inter, system-ui, sans-serif` in the baseline `main` frontend (`src/app/globals.css`). It is currently a CSS stack, not an explicit Next/font or remote font-loader integration. **PRESERVE BY DEFAULT IN FRONTEND V3** unless a later instruction authorises a font change.

**Mono/numeric font:** `"JetBrains Mono", ui-monospace, monospace`. Financial values use `font-mono` and `tabular-nums` where alignment matters. Body is 16px / 1.6; named scales are display 48, h1 36, h2 30, h3 24, h4 20, body-lg 18, small 14, caption 12. Headings are generally semibold/bold; captions commonly uppercase.

## Baseline visual tokens

| Token family | Actual baseline value/use |
| --- | --- |
| Background/surfaces | `#0b1220`, `#111827`, elevated `#1a2436`; dark-first colour scheme |
| Semantic colour | Primary `#3b82f6`; success `#22c55e`; warning `#f59e0b`; danger `#ef4444`; information `#38bdf8` |
| Neutral text | Slate scale from `#020617` to `#f8fafc` |
| Borders | `#253047`; semantic states must also have text/icons |
| Radius | 6/10/16/24px tokens; baseline cards use modest rounded borders |
| Shadows | Three slate/near-black levels, restrained |
| Layout | max content width 1280px; responsive Tailwind grids; minimum viewport 320px |
| Controls | native semantic inputs/selects/buttons, visible focus, min-height buttons; shadcn-style local Button/Card/Badge primitives |
| Icons | `lucide-react`, decorative icons marked `aria-hidden` |
| Tables/charts | local horizontal table scroll; ECharts through project chart container/theme with HTML summaries |
| Motion | 150ms component transitions; global `prefers-reduced-motion` collapse; smooth scroll disabled by preference |
| Print | global print CSS removes navigation/controls and ensures readable light output |

## Brand decisions to retain versus redesign freedom

Retain: dark professional financial-tool posture, Inter/monospace numerical treatment, semantic status language, tabular values, explainability, 320px minimum, reduced-motion support, no decorative visual noise, and strong focus states.

V3 may change: page compositions, spacing rhythm, panels/cards, navigation presentation, chart presentation, hierarchy, transitions, responsive layouts, and control styling, while preserving semantics and the primary font by default.

## Current premium iteration note

The independent premium branch uses a deeper black/blue token interpretation and presentation polish. It is a protected existing experience, not the baseline source of global tokens in `main`; document and preserve it rather than merging styles into V3.
