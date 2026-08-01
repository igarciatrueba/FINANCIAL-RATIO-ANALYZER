# CODEX_WORKFLOW.md

# Financial Ratio Analyzer

## Development Workflow

Version: 1.0

Status: Approved

---

# 1. Purpose

This document defines the mandatory development workflow for implementing the Financial Ratio Analyzer project.

Its objective is to ensure:

- predictable progress;
- high implementation quality;
- minimal rework;
- consistent architecture.

This workflow applies to every development phase.

---

# 2. Source of Truth

The implementation must always follow this order of authority.

1.

PRODUCT_REQUIREMENTS_SPECIFICATION.md

↓

2.

DESIGN_SYSTEM.md

↓

3.

VISUAL_DIRECTION.md

↓

4.

PROJECT_PRINCIPLES.md

↓

5.

DATASET_SPECIFICATION.md

↓

6.

CODEX_WORKFLOW.md

If documents conflict, higher priority documents always prevail.

---

# 3. Development Philosophy

Development is iterative.

Not exploratory.

Every implementation must be based on documentation.

Never guess.

Never improvise.

When uncertainty exists:

Stop.

Document the assumption.

Wait for approval.

---

# 4. Repository Inspection

Before writing any code.

Inspect:

Repository structure

↓

Dependencies

↓

Configuration

↓

Existing documentation

↓

AGENTS.md (if present)

↓

README

↓

Project structure

Only after inspection may implementation begin.

---

# 5. Development Cycle

Every phase follows the same lifecycle.

```
Understand

↓

Plan

↓

Implement

↓

Review

↓

Test

↓

Build

↓

Document

↓

Stop
```

The workflow repeats until completion.

---

# 6. Phase Structure

Every development phase should contain:

Objective

↓

Files affected

↓

Implementation

↓

Verification

↓

Summary

↓

Next phase

Every phase should remain self-contained.

---

# 7. Phase Approval

The agent must stop after completing each phase.

The user decides whether to continue.

Do not automatically continue.

---

# 8. Coding Standards

Every implementation must satisfy:

Strict TypeScript

↓

Reusable Components

↓

No duplicated logic

↓

Meaningful naming

↓

Small functions

↓

Composition over inheritance

↓

Readable code

Never sacrifice readability for cleverness.

---

# 9. Architecture Rules

Separate:

UI

↓

Business Logic

↓

Financial Engine

↓

Utilities

↓

Types

↓

Configuration

Never mix responsibilities.

---

# 10. Component Workflow

Before creating a component.

Verify:

Does a similar component already exist?

Can it be reused?

Does it follow the Design System?

Will it remain reusable?

If not.

Redesign before implementation.

---

# 11. Error Handling

Errors must always be:

Expected

↓

Meaningful

↓

Recoverable

Never expose implementation details to users.

---

# 12. Testing Workflow

Every completed phase should verify:

Build

↓

Lint

↓

TypeScript

↓

Unit Tests (where applicable)

↓

Manual Review

No phase should leave the project in a broken state.

---

# 13. Documentation Workflow

Every completed phase updates:

README (if needed)

↓

Architecture

↓

Comments

↓

Methodology

↓

Screenshots (when appropriate)

Documentation evolves together with the code.

---

# 14. Commit Philosophy

Every commit should represent one logical improvement.

Examples

✔ Build dashboard layout

✔ Implement financial engine

✔ Add scenario simulation

Avoid:

"misc changes"

"fix everything"

"updates"

Commit history should tell the story of the project.

---

# 15. Definition of Done

A phase is complete only when:

✓ Code compiles.

✓ No TypeScript errors.

✓ No lint errors.

✓ Documentation updated.

✓ Responsive.

✓ Accessible.

✓ Consistent with Design System.

✓ Ready for production.

---

# 16. Forbidden Behaviour

Never:

- ignore documentation;
- hardcode financial values;
- duplicate business logic;
- introduce arbitrary design decisions;
- skip testing;
- modify architecture without justification;
- continue after completing a phase.

---

# 17. Expected Deliverables

Every phase should produce:

Implemented code

↓

Summary

↓

Files changed

↓

Validation

↓

Remaining work

This allows complete traceability.

---

# 18. Final Quality Gate

Before declaring the project complete verify:

Architecture

✓

Documentation

✓

Accessibility

✓

Performance

✓

Responsiveness

✓

Financial calculations

✓

Design consistency

✓

Testing

✓

Build

✓

Deployment

✓

If any item fails.

The project is not complete.

---

# 19. Development Principles

The project should always prioritise:

Correctness

↓

Maintainability

↓

Readability

↓

Consistency

↓

Performance

↓

Elegance

Never optimise the wrong problem.

---

# 20. Final Statement

This workflow exists to guarantee that the project evolves in a disciplined, transparent and reproducible manner.

The objective is not simply to generate code.

The objective is to build a production-quality financial application through an engineering process that could realistically be followed by a professional software team.

---

# Revision History

Version

1.0

Status

Approved

Related Documents

PRODUCT_REQUIREMENTS_SPECIFICATION.md

DESIGN_SYSTEM.md

VISUAL_DIRECTION.md

PROJECT_PRINCIPLES.md

DATASET_SPECIFICATION.md

End of Document