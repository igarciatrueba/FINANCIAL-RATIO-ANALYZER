# DESIGN_SYSTEM.md

# Financial Ratio Analyzer

## Design System

Version: 1.0

Status: Approved

---
  
  # 1. Purpose
  
  This document defines the complete visual language of the Financial Ratio Analyzer project.

It establishes every visual, interaction and interface rule required to build a coherent product.

The purpose of this Design System is to eliminate subjective design decisions during development and provide a single source of truth for:
  
  - visual identity;
- user interface;
- user experience;
- component behaviour;
- spacing;
- typography;
- colour;
- animation;
- accessibility.

Every interface decision should be traceable back to this document.

---
  
  # 2. Design Philosophy
  
  Financial Ratio Analyzer is not intended to resemble:
  
  - an academic project;
- an admin template;
- a spreadsheet;
- a university dashboard;
- a generic analytics application.

Instead, it should communicate:
  
  - confidence;
- precision;
- professionalism;
- analytical thinking;
- clarity;
- transparency.

The application should immediately feel like a professional financial intelligence platform.

---
  
  # 3. Product Personality
  
  The product personality defines how the interface should be perceived by users.

## Primary attributes

- Professional
- Analytical
- Elegant
- Calm
- Precise
- Trustworthy
- Modern
- Structured
- Explainable

## Secondary attributes

- Innovative
- Technical
- Minimal
- Premium
- Efficient

The interface must never feel playful or decorative.

---
  
  # 4. Design Principles
  
  ## Principle 1
  
  Clarity before aesthetics.

Every visual element must improve understanding.

---
  
  ## Principle 2
  
  Finance before decoration.

Charts exist to answer business questions.

Animations exist to improve comprehension.

Nothing exists only because it looks impressive.

---
  
  ## Principle 3
  
  Hierarchy before density.

Users should understand the page within five seconds.

The interface should naturally guide attention.

---
  
  ## Principle 4
  
  Data tells the story.

Numbers should always remain the main visual element.

Decoration should never compete with data.

---
  
  ## Principle 5
  
  Explainability.

Every score.

Every chart.

Every recommendation.

Every indicator.

Should be explainable.

No black-box behaviour.

---
  
  ## Principle 6
  
  Consistency.

Spacing.

Typography.

Colours.

Animations.

Component behaviour.

Everything should remain consistent throughout the application.

---
  
  ## Principle 7
  
  Enterprise quality.

The application should resemble software used inside financial institutions.

Not marketing websites.

Not consumer applications.

---
  
  # 5. Brand Positioning
  
  The visual identity should communicate:
  
  "We transform financial statements into decision-ready insights."

The emphasis is not on calculation.

The emphasis is on understanding.

---
  
  # 6. Emotional Goals
  
  When opening the application the user should feel:
  
  ✓ Confidence

✓ Curiosity

✓ Control

✓ Simplicity

✓ Professionalism

Not:
  
  ✗ Confusion

✗ Information overload

✗ Visual noise

✗ Technical intimidation

---
  
  # 7. Inspiration
  
  The interface should be inspired by products such as:
  
  - Bloomberg Terminal (information density)
- Stripe Dashboard (clarity)
- Linear (minimalism)
- Vercel Dashboard (spacing)
- Notion (typography)
- GitHub (clean hierarchy)

The application should not imitate any of these products directly.

Instead, it should combine the strongest characteristics of each.

---
  
  # 8. Visual Language
  
  The interface language can be summarised in six concepts.

## Calm

Large empty spaces.

Comfortable reading.

No visual overload.

---
  
  ## Structured
  
  Everything should align to a clear grid.

No floating components.

No arbitrary spacing.

---
  
  ## Analytical
  
  Numbers always have priority.

Charts support numbers.

Icons support charts.

---
  
  ## Elegant
  
  No excessive decoration.

No flashy effects.

No exaggerated gradients.

No glossy components.

---
  
  ## Transparent
  
  Every analytical result must appear understandable.

Users should always know:
  
  - where a number comes from;
- why a score changes;
- why an insight appears.

---
  
  ## Premium
  
  Small details matter.

Micro-interactions.

Smooth transitions.

Consistent spacing.

Readable typography.

Thoughtful empty states.

Professional colour palette.

---
  
  # 9. Design Objectives
  
  The interface should allow a financial analyst to:
  
  - understand the financial condition of a company within 30 seconds;
- identify strengths and weaknesses within one minute;
- understand how the analytical engine works without reading documentation.

---
  
  # 10. What This Product Is
  
  Financial Ratio Analyzer is:
  
  ✓ A financial intelligence application

✓ A portfolio-quality SaaS product

✓ An educational analytical platform

✓ A corporate finance visualisation tool

✓ A scenario-analysis application

✓ A demonstration of software engineering and product thinking

---
  
  # 11. What This Product Is Not
  
  Financial Ratio Analyzer is not:
  
  ✗ ERP software

✗ Accounting software

✗ Auditing software

✗ Credit scoring software

✗ Investment advice

✗ Regulatory reporting software

✗ Personal finance software

✗ Stock analysis platform

The interface should never imply any of these purposes.

---
  
  # 12. Design Priorities
  
  Priority order:
  
  1. Readability

2. Analytical clarity

3. Consistency

4. Accessibility

5. Performance

6. Responsiveness

7. Animation

8. Visual refinement

Animation should never reduce usability.

---
  
  # 13. Visual Quality Standard
  
  Every screen should satisfy the following questions.

Can the user immediately identify:
  
  ✓ Primary action?
  
  ✓ Current context?
  
  ✓ Main KPI?
  
  ✓ Most important chart?
  
  ✓ Current company?
  
  ✓ Current reporting period?
  
  ✓ Financial health?
  
  If any answer is "No", the design should be reconsidered.

---
  
  # 14. Design Success Criteria
  
  The design system is considered successful when:
  
  - every page feels like part of the same product;
- new components naturally inherit existing rules;
- developers do not invent new spacing values;
- developers do not invent new colours;
- developers do not invent new typography sizes;
- developers do not invent new component styles;
- every interaction feels consistent.

This document should eliminate subjective design decisions.

---
  
  # End of Section 1
  
  Next section:
  
  Design Tokens

---
  
  # 15. Design Tokens
  
  ## Purpose
  
  Design Tokens define every reusable visual value within the application.

Developers must never invent colours, spacing values, typography sizes or border radii outside this specification.

Every visual decision must originate from this section.

---
  
  # 16. Colour System
  
  ## Design Philosophy
  
  The colour palette must communicate professionalism rather than excitement.

Dark mode is the primary experience.

Light mode may be implemented in future versions but is outside the MVP scope.

The interface should feel closer to Bloomberg or Linear than to a consumer fintech application.

---
  
  ## Colour Roles
  
  Colours are assigned semantic roles rather than arbitrary names.

### Background

Primary application background.

```text
Background
#0B1220
```

Purpose

- Main application background
- Landing page
- Dashboard background

---
  
  ### Surface
  
  ```text
Surface
#111827
```

Purpose

- Cards
- Tables
- Navigation
- Charts
- Panels

---
  
  ### Elevated Surface
  
  ```text
Surface Elevated
#1A2436
```

Purpose

- Modals
- Hover cards
- Floating panels
- Popovers

---
  
  ### Border
  
  ```text
Border
#253047
```

Purpose

- Card borders
- Input borders
- Dividers

Borders should remain subtle.

---
  
  ### Primary
  
  ```text
Primary
#3B82F6
```

Purpose

- Primary buttons
- Links
- Selected navigation
- Interactive elements
- Focus ring

Only one primary colour should exist.

---
  
  ### Success
  
  ```text
Success
#22C55E
```

Purpose

- Positive financial indicators
- Healthy score
- Successful actions

Never use success green decoratively.

---
  
  ### Warning
  
  ```text
Warning
#F59E0B
```

Purpose

- Medium-risk indicators
- Warnings
- Moderate financial health

---
  
  ### Danger
  
  ```text
Danger
#EF4444
```

Purpose

- Critical alerts
- Negative financial indicators
- Errors

Should only appear where business meaning requires it.

---
  
  ### Information
  
  ```text
Information
#38BDF8
```

Purpose

- Neutral highlights
- Methodology
- Documentation

---
  
  # 17. Neutral Scale
  
  Primary neutral palette.

```text
950
#020617

900
#0F172A

800
#1E293B

700
#334155

600
#475569

500
#64748B

400
#94A3B8

300
#CBD5E1

200
#E2E8F0

100
#F1F5F9

50
#F8FAFC
```

Only use these values.

Do not create intermediate shades.

---
  
  # 18. Typography
  
  ## Philosophy
  
  Typography should carry hierarchy.

Not colour.

Not shadows.

Not decoration.

---
  
  ## Font Family
  
  Primary

```text
Inter
```

Fallback

```text
system-ui
```

Monospace

```text
JetBrains Mono
```

Purpose

Financial values

Technical identifiers

Formula labels

---
  
  ## Font Weights
  
  ```text
400 Regular

500 Medium

600 SemiBold

700 Bold
```

Avoid weights above 700.

---
  
  # 19. Typography Scale
  
  ```text
Display
48

H1
36

H2
30

H3
24

H4
20

Body Large
18

Body
16

Small
14

Caption
12
```

Never create additional font sizes.

---
  
  # 20. Line Heights
  
  ```text
Display
120%

Headings
125%

Body
160%

Captions
150%
```

Body text should always prioritise readability.

---
  
  # 21. Grid System
  
  Desktop

12 columns

Container width

1280px

Maximum readable width

760px

---
  
  Tablet

8 columns

---
  
  Mobile

4 columns

---
  
  Spacing between columns

24px

---
  
  # 22. Spacing System
  
  Use an eight-point spacing system.

```text
4

8

12

16

24

32

40

48

64

80

96
```

Developers must not invent spacing values.

---
  
  # 23. Border Radius
  
  ```text
Small
6

Medium
10

Large
16

Extra Large
24

Round
999
```

Avoid overly rounded components.

---
  
  # 24. Shadow System
  
  Shadow should communicate elevation.

Never decoration.

---
  
  Level 1

Cards

```text
0 1px 2px rgba(...)
```

---
  
  Level 2

Dropdowns

Hover cards

```text
0 8px 20px rgba(...)
```

---
  
  Level 3

Dialogs

Modals

```text
0 20px 60px rgba(...)
```

Only three elevation levels should exist.

---
  
  # 25. Borders
  
  Cards

```text
1px solid Border
```

Inputs

```text
1px solid Border
```

Focus

```text
2px Primary
```

Danger

```text
2px Danger
```

---
  
  # 26. Iconography
  
  Primary icon library

```text
Lucide
```

Rules

- Line icons only
- No filled icons
- Consistent stroke width
- Do not mix icon families

Icons should support content.

Never replace content.

---
  
  # 27. Data Formatting
  
  Currency

```text
€ 1,234,567
```

Percentages

```text
12.45%
```

Ratios

```text
1.85x
```

Large Numbers

```text
2.3M

540K
```

Negative values

Always include minus sign.

Never use parentheses.

---
  
  # 28. Financial Colour Rules
  
  Good financial performance

Success

Neutral information

Primary

Warnings

Amber

Critical

Danger

Never encode meaning using colour alone.

Every coloured indicator must include:
  
  - text
- icon
- tooltip when required

---
  
  # 29. Contrast
  
  Minimum WCAG AA.

Preferred

WCAG AAA wherever practical.

---
  
  # 30. Responsive Breakpoints
  
  ```text
xs
480

sm
640

md
768

lg
1024

xl
1280

2xl
1536
```

No additional breakpoints.

---
  
  # 31. Design Token Rules
  
  Developers must never:
  
  - invent colours;
- invent font sizes;
- invent shadows;
- invent spacing;
- invent radii;
- invent breakpoints.

Every visual token must originate from this document.

---
  
  # End of Section 2
  
  Next section:
  
  Layout System & Component Library

---
  
  # 32. Layout Philosophy
  
  ## Purpose
  
  The layout system defines how information is organised throughout the application.

Every page should immediately communicate:
  
  - where the user is;
- what is most important;
- what action should be taken next.

The layout must minimise cognitive load.

The interface should feel structured rather than dense.

---
  
  # 33. Page Architecture
  
  Every page follows the same hierarchy.

```
Header
↓
Context Information
↓
Primary KPIs
↓
Main Visualisations
↓
Supporting Analysis
↓
Detailed Tables
↓
Methodology / Disclaimer
```

No page should violate this hierarchy without a clear business reason.

---
  
  # 34. Global Layout
  
  Desktop

```
┌──────────────────────────────────────────────┐
│ Sidebar │ Header                             │
│         ├────────────────────────────────────┤
│         │ Context                            │
│         ├────────────────────────────────────┤
│         │ KPI Cards                          │
│         ├────────────────────────────────────┤
│         │ Main Charts                        │
│         ├────────────────────────────────────┤
│         │ Detailed Analysis                  │
│         └────────────────────────────────────┘
```

Tablet

Sidebar becomes collapsible.

Mobile

Sidebar becomes drawer navigation.

---
  
  # 35. Navigation System
  
  Primary Navigation

- Overview
- Financial Input
- Ratio Analysis
- DuPont Analysis
- Scenario Lab
- Methodology

Rules

- Maximum 6 primary items.
- Never nest more than one level.
- Current page always highlighted.
- Icons accompany labels.
- Labels never replaced by icons.

---
  
  # 36. Header Specification
  
  The header should always display:
  
  Left

- Current page title
- Optional subtitle

Right

- Company selector
- Reporting period selector
- Theme (future)
- Export button

Header height

80px

Sticky behaviour

Yes.

Header elevation

Level 1 shadow only after scrolling.

---
  
  # 37. Sidebar
  
  Purpose

Provide fast navigation without distracting from analysis.

Width

Desktop

280px

Collapsed

72px

Mobile

Drawer

Rules

- Fixed position
- No floating menus
- Current item highlighted
- Smooth collapse animation
- Preserve navigation context

---
  
  # 38. Content Containers
  
  Maximum content width

1280px

Readable content

760px

Charts

Full available width

Forms

Maximum 720px

Cards

Flexible grid

Never stretch excessively on ultrawide screens.

---
  
  # 39. KPI Cards
  
  Purpose

Provide immediate understanding of the company's financial condition.

Displayed metrics

- Financial Health Score
- ROE
- Current Ratio
- Debt-to-Equity
- Free Cash Flow
- Net Margin

Maximum cards per row

Desktop

4

Tablet

2

Mobile

1

---

Card Structure

```
Title

↓

Value

↓

Trend

↓

Context
```

Example

```
Return on Equity

18.4%

↑ +2.1%

vs Previous Year
```

Rules

- One primary metric only.
- No secondary charts inside cards.
- Optional sparkline only.
- Avoid visual clutter.

---

# 40. Tables

Tables must prioritise readability.

Requirements

- Sticky header
- Zebra rows optional
- Right-aligned numbers
- Left-aligned text
- Column sorting
- Horizontal scrolling on mobile

Never use tiny fonts.

---

# 41. Forms

Form Philosophy

The form should feel like a guided financial interview.

Not a spreadsheet.

---

Sections

Income Statement

↓

Balance Sheet

↓

Cash Flow

↓

Working Capital

Each section collapsible.

---

Field Behaviour

Label

↓

Input

↓

Supporting text

↓

Validation message

Labels always visible.

Never rely on placeholders.

---

# 42. Buttons

Hierarchy

Primary

Secondary

Ghost

Danger

Only one Primary button should exist per view.

---

Primary Button

Purpose

Main action.

Examples

- Start Analysis
- Calculate
- Save Scenario

---

Secondary Button

Purpose

Alternative actions.

Examples

- Reset
- Export
- Load Demo

---

Ghost Button

Purpose

Low-priority interactions.

Examples

- Cancel
- Back

---

Danger Button

Purpose

Destructive actions only.

Examples

- Clear Data

Never use Danger styling for navigation.

---

# 43. Inputs

Supported Inputs

- Text
- Number
- Currency
- Percentage
- Dropdown
- Date
- Slider
- Toggle

All inputs must share:

- identical height
- border radius
- focus state
- spacing
- typography

---

Focus State

2px Primary border

Subtle glow

No browser default outline.

---

Validation States

Neutral

Success

Warning

Error

Each state changes:

- border
- helper text
- icon

Never colour the entire input background.

---

# 44. Cards

Purpose

Cards group related information.

Types

- KPI
- Analysis
- Chart
- Methodology
- Insight

Cards never overlap.

Padding

32px

Gap

24px

Border

Always visible.

---

# 45. Insight Cards

Two categories only.

Strength

Green indicator

Risk

Amber or Red indicator

Structure

```
Icon

↓

Title

↓

Explanation

↓

Supporting Metric
```

Maximum

Three strengths

Three risks

Avoid overwhelming users.

---

# 46. Chart Containers

Every chart shares the same structure.

```
Title

↓

Description

↓

Chart

↓

Legend

↓

Source / Methodology
```

No chart appears without context.

---

# 47. Empty States

Purpose

Guide users when no data is available.

Structure

Illustration

↓

Title

↓

Explanation

↓

Primary Action

Example

"No financial data has been entered yet."

↓

"Load a demo company or start a new analysis."

Never leave blank screens.

---

# 48. Loading States

Use skeleton loaders.

Never use spinners for page loading.

Skeletons should preserve layout stability.

---

# 49. Error States

Every error should include:

- explanation;
- probable cause;
- suggested action.

Never expose technical stack traces.

---

# 50. Tooltips

Purpose

Explain financial concepts.

Not interface elements.

Examples

ROCE

Current Ratio

Interest Coverage

Tooltips should remain concise.

Maximum

120 words.

---

# 51. Modals

Only for important decisions.

Examples

- Export
- Reset analysis
- Methodology

Never use modals for routine navigation.

---

# 52. Notifications

Only four types.

Success

Information

Warning

Error

Position

Top-right

Auto dismiss

5 seconds

Errors remain visible until dismissed.

---

# 53. Icons

Icons reinforce meaning.

Never replace labels.

Maximum icon size

20px

Consistent stroke width.

---

# 54. Component Consistency Rules

Every component must share:

- spacing scale;
- typography;
- border radius;
- interaction behaviour;
- animation timing;
- elevation;
- colour semantics.

No component may define its own design language.

---

# 55. Component Acceptance Criteria

A component is considered complete when:

✓ Accessible

✓ Responsive

✓ Keyboard navigable

✓ Reusable

✓ Documented

✓ Theme compliant

✓ Uses design tokens only

✓ No hard-coded colours

✓ No hard-coded spacing

✓ Behaviour consistent with all other components

---

# End of Section 3

Next section:

Financial Visualisations, Motion System & Accessibility

---

# 56. Data Visualisation Philosophy

## Purpose

Charts exist to support financial decision-making.

They are not decorative elements.

Every visualisation must answer a specific business question.

If a chart does not improve understanding, it should not exist.

---

# 57. Visualisation Principles

Every chart must satisfy the following principles:

✓ Explain a business concept

✓ Highlight relevant change

✓ Support comparison

✓ Reduce cognitive effort

✓ Be understandable without documentation

Never prioritise aesthetics over readability.

---

# 58. Chart Hierarchy

Charts are divided into three importance levels.

## Level 1

Executive charts.

Displayed immediately after KPI cards.

Examples:

- Financial Health Score
- Radar
- Trend Analysis

---

## Level 2

Supporting analysis.

Examples:

- DuPont
- Waterfall
- Working Capital Cycle

---

## Level 3

Detailed exploration.

Examples:

- Historical tables
- Supporting distributions
- Scenario comparisons

---

# 59. Executive Score Visual

Purpose

Present overall financial condition immediately.

Preferred style

Circular radial indicator.

Display:

- Score
- Classification
- Year-over-year change
- Confidence explanation

Avoid dashboard gauges that resemble speedometers.

---

# 60. Radar Chart

Purpose

Compare financial dimensions.

Axes

- Profitability
- Liquidity
- Solvency
- Efficiency
- Cash Flow

Rules

Maximum one radar per page.

Interactive tooltip required.

Dimension labels always visible.

---

# 61. Trend Charts

Purpose

Show financial evolution.

Preferred chart

Line chart.

Requirements

- Smooth interpolation disabled.
- Straight lines.
- Interactive tooltip.
- Highlight current period.
- Consistent colours.

No unnecessary animation.

---

# 62. Waterfall Chart

Purpose

Explain profitability composition.

Recommended flow

Revenue

↓

COGS

↓

Gross Profit

↓

Operating Costs

↓

EBIT

↓

Interest

↓

Net Income

The sequence should always remain identical.

---

# 63. DuPont Visualisation

Purpose

Explain ROE.

Preferred layout

Connected tree.

```
ROE

↓

Net Margin

×

Asset Turnover

×

Financial Leverage
```

The relationship between factors must be immediately understandable.

---

# 64. Working Capital Cycle

Preferred layout

Horizontal timeline.

```
Inventory

↓

Receivables

↓

Payables

↓

Cash Conversion Cycle
```

Do not use pie charts.

---

# 65. Scenario Comparison

Purpose

Compare Base vs Scenario.

Every comparison must display:

Base

↓

Scenario

↓

Absolute Difference

↓

Percentage Difference

↓

Impact on Score

---

# 66. Chart Rules

Every chart includes:

Title

↓

Description

↓

Chart

↓

Legend

↓

Methodology

↓

Data source

No chart should appear without context.

---

# 67. Chart Colours

Financial meaning determines colour.

Positive

Success

Negative

Danger

Neutral

Primary

Comparison

Slate

Never use rainbow palettes.

---

# 68. Chart Animation

Animation exists only to explain change.

Maximum duration

500ms

No continuous looping.

No bouncing.

No rotating charts.

---

# 69. Motion Philosophy

Motion should communicate:

Hierarchy

↓

Transition

↓

Cause

↓

Effect

Never decoration.

---

# 70. Animation Timing

Micro interactions

150ms

Component transitions

250ms

Page transitions

350ms

Maximum animation

500ms

Avoid animations exceeding one second.

---

# 71. Hover Behaviour

Hover should communicate interactivity.

Allowed effects

- subtle elevation
- border highlight
- slight scale (max 1.02)
- background tint

Never:

- rotate
- bounce
- glow excessively

---

# 72. Page Transition

Use fade combined with slight vertical movement.

Maximum movement

16px

Never animate large horizontal movement.

---

# 73. Skeleton Loading

Preferred loading pattern.

Skeletons preserve layout.

Avoid full-page spinners.

Cards

↓

Chart placeholders

↓

Table placeholders

---

# 74. Empty States

Every empty state contains:

Illustration

↓

Headline

↓

Explanation

↓

Primary Action

Example

"No analysis has been generated."

↓

"Load a demo company to explore the platform."

---

# 75. Error States

Error pages must explain:

What happened

Why it happened

How to recover

Technical errors must never be exposed directly.

---

# 76. Accessibility Philosophy

Accessibility is a product requirement.

Not an enhancement.

---

# 77. Keyboard Navigation

Every interactive element must support:

Tab

Shift + Tab

Enter

Escape

Arrow keys where appropriate.

Visible focus required.

---

# 78. Focus Indicators

Use Primary colour.

Minimum thickness

2px

Never remove focus styles.

---

# 79. Screen Reader Support

Every:

Button

Input

Chart

Navigation item

Dialog

Tooltip

Requires meaningful ARIA labels.

---

# 80. Colour Accessibility

Colour cannot be the only source of information.

Every status indicator must include:

Text

Icon

Colour

Optional tooltip

---

# 81. Contrast

Minimum

WCAG AA

Target

WCAG AAA

Charts must remain distinguishable for colour-blind users.

---

# 82. Reduced Motion

Respect

prefers-reduced-motion

Requirements

Disable:

- guided animations
- chart transitions
- decorative movement

Preserve:

- layout
- hierarchy
- usability

---

# 83. Responsive Behaviour

Desktop

Information-first.

Tablet

Component reflow.

Mobile

Content prioritisation.

Do not simply shrink desktop layouts.

---

# 84. Performance Budget

Target

60 FPS

Avoid

Heavy shadows

Massive blur

Unnecessary DOM nodes

Large animation libraries

---

# 85. Visual Consistency Checklist

Before approving any screen verify:

✓ Typography matches scale

✓ Design tokens only

✓ Grid respected

✓ Consistent spacing

✓ Consistent elevation

✓ Accessible colours

✓ Responsive

✓ Keyboard accessible

✓ Charts documented

✓ Empty states present

✓ Loading state present

✓ Error state present

---

# 86. Visual QA Acceptance Criteria

The Design System is considered implemented successfully when:

- Every screen belongs to the same visual language.
- Every component uses design tokens.
- No component introduces custom spacing.
- No component introduces custom colours.
- No component introduces custom typography.
- Motion remains subtle and purposeful.
- Charts remain readable on every device.
- Accessibility passes automated and manual review.
- The interface communicates professionalism within the first five seconds.

---

# End of Section 4

Next section:

Implementation Guidelines, Tailwind Mapping & Design QA

---

# 87. Design Implementation Philosophy

## Purpose

This section defines how the Design System should be translated into code.

Developers should never interpret visual decisions independently.

Every implementation must originate from:

- Design Tokens
- Component Library
- Layout System
- Motion Rules
- Accessibility Rules

The implementation should remain deterministic.

---

# 88. Tailwind Implementation Strategy

## Principle

Tailwind CSS should become the implementation layer of the Design System.

Tailwind is not the Design System.

The Design System defines the rules.

Tailwind implements those rules.

---

## Theme Extension

Extend Tailwind instead of using arbitrary values.

Avoid:

```tsx
className="bg-[#123456] rounded-[13px] mt-[23px]"
```

Prefer:

```tsx
className="bg-surface rounded-lg mt-6"
```

---

## Token Mapping

Every Design Token should become a Tailwind token.

Example

Colors

```
background
surface
surface-elevated
primary
success
warning
danger
border
```

Spacing

```
space-1

space-2

space-3
...
```

Typography

```
display

h1

h2

body

caption
```

Border Radius

```
sm

md

lg

xl
```

Shadows

```
shadow-1

shadow-2

shadow-3
```

No arbitrary values.

---

# 89. Component Architecture

Components must be organised by responsibility.

```
components/

ui/

layout/

dashboard/

charts/

forms/

engine-map/

scenario/

analysis/
```

Business logic must never live inside UI components.

---

# 90. Component Design Rules

Every component must satisfy:

Single Responsibility

↓

Reusable

↓

Composable

↓

Accessible

↓

Responsive

↓

Token-based

↓

Documented

---

# 91. Naming Convention

Components

```
PascalCase
```

Files

```
kebab-case
```

Hooks

```
useSomething()
```

Utilities

```
camelCase
```

Types

```
PascalCase
```

Enums

```
UPPER_SNAKE_CASE
```

Maintain consistency across the repository.

---

# 92. State Design

Visual state should always derive from application state.

Avoid duplicated state.

Avoid unnecessary local state.

Prefer predictable state flow.

---

# 93. Component Documentation

Every reusable component should include:

Purpose

↓

Props

↓

Variants

↓

Accessibility notes

↓

Example usage

↓

Implementation notes

Future developers should understand the component without reading its implementation.

---

# 94. Accessibility QA

Before approving any component verify:

✓ Keyboard navigation

✓ Focus visible

✓ Screen reader labels

✓ Colour contrast

✓ Touch targets

✓ Responsive layout

✓ Motion compatibility

No exceptions.

---

# 95. Responsive QA

Verify every screen on:

Desktop

↓

Laptop

↓

Tablet

↓

Large Mobile

↓

Small Mobile

Layouts should adapt.

Never simply shrink.

---

# 96. Performance Guidelines

Preferred

Lazy loading

↓

Code splitting

↓

Memoisation where justified

↓

Efficient rendering

Avoid premature optimisation.

Measure before optimising.

---

# 97. Animation Guidelines

Animations should explain.

Not entertain.

Maximum animation duration

500ms

Hover

150ms

Transitions

250ms

Page

350ms

No infinite animations.

---

# 98. Engineering Principles

Every implementation should satisfy:

Readable

↓

Maintainable

↓

Scalable

↓

Testable

↓

Predictable

↓

Accessible

↓

Performant

The simplest solution should always be preferred.

---

# 99. Design Review Checklist

Every page should answer YES to:

Layout

✓ Consistent spacing

✓ Proper hierarchy

✓ Grid respected

Components

✓ Uses Design Tokens

✓ Accessible

✓ Responsive

✓ Reusable

Typography

✓ Correct hierarchy

✓ Correct sizes

✓ Proper line height

Charts

✓ Business purpose

✓ Methodology

✓ Readability

Interaction

✓ Hover

✓ Focus

✓ Loading

✓ Empty

✓ Error

Performance

✓ Smooth

✓ Lightweight

✓ Responsive

If any answer is NO, the page is not production-ready.

---

# 100. Repository Quality Standard

The repository should resemble a professional SaaS product.

The following should exist:

README

↓

Architecture documentation

↓

Methodology

↓

Formula catalogue

↓

Design System

↓

Screenshots

↓

Assets

↓

Roadmap

↓

License

↓

Well-organised source code

Documentation is considered part of the product.

---

# 101. Design Governance

Future changes to the Design System should follow these rules.

Never introduce:

- new colours;
- new spacing values;
- new typography scales;
- new animation timings;
- new component styles;

without updating this document.

The Design System is the single source of truth.

---

# 102. Future Evolution

Future versions may include:

- Light Theme
- Internationalisation
- Design Tokens as JSON
- Storybook
- Component Testing
- Theme Generator
- Multi-brand support

These are outside the MVP.

---

# 103. Definition of Done

The Design System is complete when:

✓ Every screen follows the same visual language.

✓ Every component uses Design Tokens.

✓ Every interaction follows Motion Rules.

✓ Every chart follows Visualisation Rules.

✓ Every page satisfies Accessibility Requirements.

✓ Every implementation is responsive.

✓ Every reusable component is documented.

✓ Developers no longer need to invent visual decisions.

At this point, the Design System becomes the visual contract of the application.

---

# 104. Final Design Statement

Financial Ratio Analyzer should communicate:

Professionalism.

Clarity.

Financial expertise.

Engineering quality.

Analytical thinking.

Trust.

The user should feel that they are interacting with a carefully designed financial intelligence platform rather than a demonstration project.

Every interface decision should reinforce that perception.

---

# Revision History

Version

1.0

Status

Approved

Document Owner

Product Design

Applies To

Entire Project

Related Documents

PRODUCT_REQUIREMENTS_SPECIFICATION.md

VISUAL_DIRECTION.md

PROJECT_PRINCIPLES.md

DATASET_SPECIFICATION.md

CODEX_WORKFLOW.md

End of Document