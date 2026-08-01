# VISUAL_DIRECTION.md

# Financial Ratio Analyzer

## Visual Direction

Version: 1.0

Status: Approved

---

# 1. Purpose

The Design System defines the rules.

This document defines the experience.

Its objective is to describe exactly how the application should feel, how users should navigate through it and how every screen should be visually structured.

If the Design System answers **"how should components look?"**, this document answers **"what should the complete product look like?"**

---

# 2. Experience Statement

The Financial Ratio Analyzer should feel like a premium Financial Intelligence Platform.

The experience should communicate:

- confidence;
- engineering quality;
- transparency;
- analytical thinking;
- executive-level reporting.

The application must never resemble:

- an admin template;
- a student dashboard;
- a spreadsheet with charts;
- a Streamlit application;
- a generic Bootstrap interface.

Instead, the interface should resemble software that could realistically be used inside:

- an investment firm;
- a consulting company;
- a private equity firm;
- a finance department.

---

# 3. Product Story

The application tells a visual story.

```
Financial Statements

↓

Validation

↓

Financial Intelligence

↓

Business Analysis

↓

Executive Dashboard

↓

Scenario Exploration

↓

Decision Support
```

The interface should reinforce this journey at every step.

Users should always understand where they are in the analysis process.

---

# 4. Global Information Architecture

The product is intentionally small.

Every screen must have a clear purpose.

```
Landing

↓

Financial Input

↓

Executive Dashboard

↓

Scenario Lab

↓

Methodology
```

No additional pages should be introduced during the MVP unless explicitly approved.

---

# 5. Landing Page Blueprint

The landing page is the product showcase.

Its objective is to convince the user to start an analysis.

Structure:

```
──────────────────────────────────────────────

Navigation

──────────────────────────────────────────────

Hero Section

──────────────────────────────────────────────

Interactive Analysis Engine Map

──────────────────────────────────────────────

Dashboard Preview

──────────────────────────────────────────────

Key Features

──────────────────────────────────────────────

Methodology

──────────────────────────────────────────────

Footer

──────────────────────────────────────────────
```

The user should understand the product before entering any data.

---

# 6. Hero Section

Purpose

Immediately communicate value.

Structure

```
Headline

↓

Supporting text

↓

Primary CTA

↓

Secondary CTA

↓

Hero Illustration
```

Recommended headline

> Understand a company's financial health in minutes.

Supporting text

Explain that the application transforms simplified financial statements into decision-ready insights using transparent financial methodology.

Primary CTA

Start Analysis

Secondary CTA

Load Demo Company

---

# 7. Hero Illustration

The hero should not contain decorative artwork.

Instead, it should display a clean product preview.

Preferred content:

- Executive Dashboard
- Financial Health Score
- Radar Chart
- Trend Chart

The illustration should create trust.

---

# 8. Interactive Analysis Engine

Immediately below the hero.

This becomes the visual centrepiece of the landing page.

Purpose

Explain what happens behind the scenes.

Flow

```
Financial Input

↓

Validation

↓

Formula Engine

↓

Financial Ratios

↓

Health Score

↓

Insight Engine

↓

Dashboard

↓

Scenario Analysis
```

Requirements

- animated data flow;
- clickable nodes;
- business view;
- technical view;
- guided walkthrough.

This section differentiates the application from a traditional dashboard.

---

# 9. Dashboard Preview

After users understand the analytical engine they should immediately see the expected output.

Display

Large product screenshot.

Do not use mockups.

Use actual application screenshots.

Highlighted elements

- Health Score
- Radar
- Ratio Trends
- DuPont
- Scenario Comparison

---

# 10. Features Section

Present six capabilities.

Structure

```
Financial Analysis

↓

Scenario Simulation

↓

Executive Reporting

↓

Transparent Methodology

↓

Deterministic Insights

↓

Interactive Architecture
```

Each feature:

Icon

↓

Title

↓

Two-line explanation

---

# 11. Methodology Preview

Purpose

Increase credibility.

Display

Small explanation.

Link

Learn More

The methodology page explains:

- scoring;
- ratios;
- assumptions;
- limitations.

---

# 12. Dashboard Architecture

The dashboard is the core of the application.

Desktop hierarchy

```
Header

↓

Context

↓

Executive KPI Row

↓

Financial Health Score

↓

Financial Dimensions

↓

Trend Analysis

↓

DuPont Analysis

↓

Scenario Comparison

↓

Strengths & Risks

↓

Detailed Ratios

↓

Methodology
```

Every section should naturally lead to the next.

---

# 13. Dashboard Layout

```
┌────────────────────────────────────────────┐

Header

├────────────────────────────────────────────┤

Context

├────────────────────────────────────────────┤

KPI Cards

├───────────────┬────────────────────────────┤

Score           │ Radar

├───────────────┴────────────────────────────┤

Trend Analysis

├────────────────────────────────────────────┤

DuPont

├────────────────────────────────────────────┤

Scenario Comparison

├────────────────────────────────────────────┤

Strengths │ Risks

├────────────────────────────────────────────┤

Financial Ratios

└────────────────────────────────────────────┘
```

The eye should naturally move from top to bottom.

---

# 14. Visual Hierarchy

Importance order

1. Health Score

2. KPI Cards

3. Trend Analysis

4. Radar

5. DuPont

6. Scenario Comparison

7. Insights

8. Ratios

Users should understand the company's financial condition before exploring details.

---

# 15. Scenario Lab

Purpose

Encourage exploration.

Layout

```
Scenario Controls

↓

Updated KPIs

↓

Updated Charts

↓

Updated Insights

↓

Comparison
```

Every change should produce immediate visual feedback.

The user should never need to press "Calculate".

---

# 16. Methodology Page

Purpose

Increase transparency.

Structure

```
Overview

↓

Formula Catalogue

↓

Scoring

↓

Thresholds

↓

Limitations

↓

Disclaimer
```

The page should feel like technical documentation rather than marketing.

---

# 17. Navigation Flow

The recommended navigation sequence is

Landing

↓

Start Analysis

↓

Financial Input

↓

Executive Dashboard

↓

Scenario Lab

↓

Methodology

↓

Export

Users should never feel lost.

---

# 18. Screen Density

Every screen should contain enough information to feel professional.

Never enough information to feel overwhelming.

White space is part of the design.

---

# 19. Empty Screens

No blank page should ever exist.

Every empty state should explain:

- what the page does;
- why there is no data;
- what the next action is.

---

# 20. Product Quality Goal

The interface should create the impression that the product belongs to the same quality category as:

- Stripe Dashboard
- Linear
- Vercel
- Bloomberg Terminal (modern interpretation)
- GitHub

Not because it copies them.

Because it follows the same design discipline.

---

# End of Section 1

Next Section

---

# 21. Visual Inspiration

The application should draw inspiration from established software products.

The objective is not imitation.

The objective is understanding why these interfaces work.

## Bloomberg

Take inspiration from:

- information hierarchy;
- financial credibility;
- analytical layout.

Avoid:

- excessive density;
- legacy interface patterns.

---

## Stripe Dashboard

Take inspiration from:

- spacing;
- clarity;
- typography;
- component consistency.

Avoid:

- marketing aesthetics.

---

## Linear

Take inspiration from:

- minimalism;
- navigation;
- interaction quality;
- subtle animations.

Avoid:

- software-development specific metaphors.

---

## Vercel Dashboard

Take inspiration from:

- whitespace;
- premium feeling;
- visual rhythm.

---

## GitHub

Take inspiration from:

- documentation;
- structure;
- clean presentation.

---

## Apple

Take inspiration from:

- polish;
- motion quality;
- simplicity;
- visual confidence.

---

# 22. Visual References

The following reference pack should accompany the project.

```
references/

landing-reference.png

dashboard-reference.png

charts-reference.png

hero-reference.png

cards-reference.png

motion-reference.mp4

typography-reference.png
```

These files are not copied.

They exist only to communicate quality expectations.

---

# 23. Hero Direction

The hero section should immediately communicate:

Professional Financial Intelligence.

Layout

```
Headline

↓

Description

↓

Actions

↓

Interactive Dashboard Preview
```

The dashboard preview should occupy approximately 60% of the hero width.

Large empty margins should remain.

Avoid full-width text blocks.

---

# 24. Dashboard Direction

The dashboard should resemble software used daily by financial professionals.

The eye should naturally follow this path.

```
Company

↓

Health Score

↓

Executive KPIs

↓

Financial Dimensions

↓

Trend Analysis

↓

DuPont

↓

Scenario Simulation

↓

Detailed Ratios
```

Users should never wonder where to look next.

---

# 25. Engine Map Direction

The Engine Map is the visual signature of the product.

It should become the element users remember.

Requirements

- elegant;
- animated;
- understandable;
- interactive;
- educational.

The animation should communicate information flowing through the analytical engine.

The objective is to explain complexity through simplicity.

---

# 26. Dashboard Screens

Every dashboard screen should answer one business question.

Overview

"What is the company's overall financial condition?"

---

Ratios

"Why does the score look like this?"

---

DuPont

"What drives ROE?"

---

Scenario Lab

"What happens if assumptions change?"

---

Methodology

"How were these results obtained?"

Every screen has a single purpose.

---

# 27. Visual Rhythm

Information should alternate between:

Numbers

↓

Charts

↓

Text

↓

Interaction

↓

Numbers

Avoid long uninterrupted sections of text.

Avoid multiple large charts stacked together.

Create a natural reading rhythm.

---

# 28. Reading Pattern

Desktop

Z-pattern.

Dashboard

F-pattern.

Forms

Vertical flow.

Charts

Top-down.

The interface should support natural eye movement.

---

# 29. White Space Philosophy

White space is an active design element.

Its purpose is to:

- reduce cognitive load;
- improve hierarchy;
- increase readability.

Do not attempt to fill empty space.

Empty space is intentional.

---

# 30. Micro-interactions

Every important interaction should provide feedback.

Hover

↓

Focus

↓

Click

↓

Loading

↓

Result

Feedback should be immediate.

Never leave the user uncertain.

---

# 31. Product Photography

Avoid stock photography.

Avoid business people.

Avoid office scenes.

Preferred visuals

- product screenshots;
- diagrams;
- financial graphics;
- architecture illustrations.

The software itself should become the visual identity.

---

# 32. Icon Usage

Icons reinforce concepts.

Examples

Financial Health

Shield

Liquidity

Droplets

Profitability

Trending Up

Risk

Triangle Alert

Scenario

Sliders

Methodology

Book Open

Icons should improve scanning speed.

---

# 33. Product Identity

If screenshots are shared on:

GitHub

↓

LinkedIn

↓

Portfolio

↓

CV

Users should recognise the product immediately.

The visual identity must remain consistent across every medium.

---

# 34. Visual Anti-Patterns

Never use:

- glassmorphism;
- excessive gradients;
- rainbow charts;
- neon colours;
- 3D interfaces;
- floating widgets;
- oversized icons;
- decorative animations;
- dashboard clutter;
- inconsistent spacing;
- more than one accent colour.

Consistency is more important than novelty.

---

# 35. Screenshot Strategy

The repository should eventually contain:

Landing

Dashboard

Scenario Lab

DuPont

Engine Map

Methodology

Dark Theme

These screenshots should be used across:

README

LinkedIn

Portfolio

Documentation

---

# 36. Animation Quality

Animations should feel invisible.

Users should notice the product.

Not the animation.

Every movement should have a reason.

Every transition should communicate state.

---

# 37. User Perception Goals

After using the application, users should think:

"This feels like professional financial software."

"This analytical process is transparent."

"The dashboard is easy to understand."

"I trust the methodology."

"I understand why the score was generated."

These are the desired emotional outcomes.

---

# 38. Visual Acceptance Criteria

The Visual Direction is considered successfully implemented when:

✓ The landing page communicates value within five seconds.

✓ The analytical process is understandable without documentation.

✓ The Engine Map becomes the most memorable element.

✓ Every page follows the same visual language.

✓ Navigation feels predictable.

✓ Charts answer business questions.

✓ The dashboard feels premium.

✓ The product looks suitable for a professional portfolio.

✓ Screenshots can be shared publicly without further redesign.

---

# 39. Definition of Success

The project succeeds visually if:

A recruiter opens the repository,

looks at the screenshots,

and immediately assumes that the project required a multidisciplinary process involving:

- Product Design;
- UX;
- Frontend Engineering;
- Financial Analysis;
- Software Architecture.

That perception should exist before reading a single line of code.

---

# Revision History

Version

1.0

Status

Approved

Related Documents

DESIGN_SYSTEM.md

PROJECT_PRINCIPLES.md

PRODUCT_REQUIREMENTS_SPECIFICATION.md

CODEX_WORKFLOW.md

DATASET_SPECIFICATION.md

End of Document
Visual References, Screen Moodboards, UX Guidelines and Product Identity