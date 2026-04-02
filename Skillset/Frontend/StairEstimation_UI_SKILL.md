---
name: stair-estimation-ui
description: Design and extend the Stair & Railings estimation page (StairConfig.jsx). Use when asked to modify the layout, stat cards, summary panel, modal, floating action bar, or any visual element of the estimation page. NEVER modify calculation logic, state handlers, or API calls — UI only.
---

# Stair Estimation Page — UI Design System

The Stair & Railings estimation page (`StairConfig.jsx`) uses a **two-column GPT-style layout** with a fixed left summary rail and a scrollable right canvas.

## Layout Architecture

```
.stair-page  (flex row)
├── aside.sc-rail  (220px fixed, sticky, overflow-y: auto)
│   ├── .sc-rail-section          — Summary
│   │   ├── .sc-stat-grid-2       — 2×2 mini stat tiles (Stairs/GuardRails/Landings/Rails)
│   │   ├── .sc-kpi-card          — Steel Weight KPI
│   │   └── .sc-kpi-card.sc-kpi-accent — Est. Cost KPI (green border)
│   ├── .sc-rail-divider
│   ├── .sc-rail-section          — Stair Navigation
│   │   ├── .sc-stair-nav         — Per-stair nav button (active = green dot + bg)
│   │   └── .sc-add-stair         — Dashed "+ Add Stair" button
│   └── .sc-rail-section          — Quick Actions
│       ├── .sc-rail-action-btn   — ⚡ Run Estimation (green primary)
│       └── .sc-rail-action-btn.sc-rail-outline — SFE Report (outline)
└── div.sc-canvas  (flex: 1, padding: 24px 28px, flex-col, gap: 20px)
    ├── .sc-page-header            — Title + action buttons
    ├── .sc-project-banner         — Project name / ref chips
    ├── .sc-summary-panel          — Result table (shown after calculation)
    ├── .sc-trace-panel            — Formula trace (dark, monospace)
    ├── StairItem[]                — Collapsible stair sections
    └── Add Another Stair row
```

The **Floating Action Bar** (`.sc-fab`) sits `position: fixed; bottom: 20px` centered, using `#202123` background — identical to the ChatGPT sidebar color. It uses `z-index: 1000`.

The **Template Modal** (`.sc-modal-backdrop`) uses `position: fixed; inset: 0` with `backdrop-filter: blur(4px)` and centers a `.sc-modal-panel` with 3 `.sc-template-card` buttons.

## Color Palette (matches `globals.css` GPT tokens)

| Use | Class/Token | Value |
|---|---|---|
| Active state | `var(--gpt-accent)` | `#10a37f` |
| Active background | — | `rgba(16,163,127,0.08)` |
| KPI accent border | `.sc-kpi-accent` | `border-color: var(--gpt-accent)` |
| Grand total row | `.sc-grand-total` | `background: #0d0d0d; color: #fff` |
| Shaded table columns | `.sc-col-shaded` | `background: #f4f4f4` |
| FAB background | `.sc-fab` | `background: #202123` |
| FAB run button | `.sc-fab-run` | `background: var(--gpt-accent)` |

## Key CSS Classes (all in `globals.css`)

### Left Rail
- `.sc-rail` — sticky sidebar container
- `.sc-mini-stat`, `.sc-mini-stat-val`, `.sc-mini-stat-label` — 2×2 stat tiles
- `.sc-kpi-card` — weight/cost KPI row with icon
- `.sc-stair-nav`, `.sc-stair-nav.active` — nav item (active = green)
- `.sc-nav-bullet` — 6px dot indicator
- `.sc-nav-tag` — cost tag chip (green pill)
- `.sc-add-stair` — dashed add button
- `.sc-rail-action-btn` — full-width action button
- `.sc-rail-action-btn.sc-rail-outline` — ghost variant

### Right Canvas
- `.sc-page-header` — title + actions flex row
- `.sc-project-chip` — project/ref banner chips (green/purple left border)
- `.sc-summary-panel` — white card wrapping result table
- `.sc-est-table` — GPT-palette data table
- `.sc-num-cell`, `.sc-row-label`, `.sc-col-shaded` — table cells
- `.sc-yes-badge` — green "YES" badge
- `.sc-totals-box`, `.sc-total-row`, `.sc-grand-total` — totals summary
- `.sc-trace-panel`, `.sc-trace-row`, `.sc-trace-comp`, `.sc-trace-out` — dark formula trace

### Floating Action Bar
- `.sc-fab` — black pill, fixed bottom center
- `.sc-fab-btn` — pill button base
- `.sc-fab-save` — dark grey save button
- `.sc-fab-report` — green-tint report button
- `.sc-fab-excel` — green-tint excel button
- `.sc-fab-run` — solid green run button
- `.sc-spinner` — CSS-only spinner (used while calculating)

### Template Modal
- `.sc-modal-backdrop` — rgba overlay with blur
- `.sc-modal-panel` — white card, 520px wide, 16px border-radius
- `.sc-template-grid` — 3-column grid
- `.sc-template-card` — card button (hover = green border + bg tint)

## Sacred Rules

1. **Zero logic changes** — never modify any `useState`, `useCallback`, `useEffect`, API calls, or data-processing code in StairConfig.jsx
2. **All sub-components untouched** — `StairFlight`, `RailConfig`, `LandingConfig`, `SFEEstimateReport` are never modified for UI tasks
3. The `.sc-stair-nav.active` class is set via `activeId === stair.id` — use `setActiveId()` + `document.getElementById().scrollIntoView()` for navigation
4. The `.collapsible-section.active` override in `globals.css` uses `!important` to ensure the GPT green replaces the old blue — this is intentional

## Extending

**To add a new stat KPI to the rail:**
```jsx
<div className="sc-kpi-card">
  <IconName size={14} color="var(--gpt-text-muted)" />
  <div>
    <div className="sc-kpi-label">Label</div>
    <div className="sc-kpi-value">{value}</div>
  </div>
</div>
```

**To add a new FAB button:**
```jsx
<button className="sc-fab-btn sc-fab-save" onClick={handler}>
  <Icon size={14} /> Button Label
</button>
```
Add a new color variant class to `globals.css` following `.sc-fab-save` pattern.
