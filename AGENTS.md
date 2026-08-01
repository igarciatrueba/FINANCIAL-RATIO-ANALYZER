# AGENTS.md

## Project
Financial Ratio Analyzer

## Mandatory reading order
1. `docs/PRODUCT_REQUIREMENTS_SPECIFICATION.md`
2. `docs/DESIGN_SYSTEM.md`
3. `docs/VISUAL_DIRECTION.md`
4. `docs/PROJECT_PRINCIPLES.md`
5. `docs/DATASET_SPECIFICATION.md`
6. `docs/CODEX_WORKFLOW.md`

## Source of truth
`docs/PRODUCT_REQUIREMENTS_SPECIFICATION.md` is the primary source of truth.

## Workflow
Work phase by phase. Before each phase, inspect the repository, restate the objective, list acceptance criteria, expected files, assumptions and risks. After each phase, summarise changed files, explain material decisions, run relevant checks, report remaining issues and stop for approval.

## Scope
Do not add authentication, databases, live financial APIs, generative AI, Excel/CSV import, a separate backend or collaboration features unless explicitly approved.

## Quality
Maintain strict TypeScript, pure financial functions, deterministic calculations, base-case immutability, design-token compliance, accessibility, responsive behaviour, tests and documentation.

Never display `NaN` or `Infinity`. Never hard-code analytical outputs inside UI components.
