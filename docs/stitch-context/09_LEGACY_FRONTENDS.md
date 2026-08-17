# Protected Existing Frontends

## Frontend V1 / Baseline

- **Location:** main worktree `/Users/igarciatrueba/Developer/FINANCIAL-RATIO-ANALYZER`, branch `main`.
- **Implementation:** `src/app`, `src/features`, `src/components`, `src/app/globals.css`.
- **Routes:** `/`, `/input`, `/analysis`, `/analysis/ratios`, `/analysis/dupont`, `/scenario`, `/engine-map`, `/methodology`.
- **Run:** `npm run dev` from this worktree, using a non-conflicting port if needed.

## Frontend V2 / Premium experiment

- **Location:** separate worktree `/Users/igarciatrueba/Developer/FINANCIAL-RATIO-ANALYZER-PREMIUM`, branch `design-experiment-premium-front`.
- **History:** independent commits `29a244f`, `bdbe3fd`, `b47d605` when this pack was prepared.
- **Implementation:** shares the repository engine but has its own premium frontend styling/layout changes.
- **Routes:** same product route surface as V1.
- **Run:** reviewed locally at `http://localhost:3003`, or use `npm run dev -- -p <free-port>` in its own worktree.

## Protection rule

> **Frontend V3 must coexist with previous frontend implementations until the user explicitly approves a migration or deletion.**

Do not delete, rename, overwrite, globally restyle, or silently redirect V1/V2 pages. Do not treat V2 as a replacement for V1 solely because it is visually newer.

## Rollout and rollback

Use a separate route namespace or explicit feature flag/route mapping for V3. Keep V1/V2 components/CSS intact. Rollback must be a route/flag change, not a domain migration. A later migration needs parity review against `feature-matrix.json` and explicit approval.
