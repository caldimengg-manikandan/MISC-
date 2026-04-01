---
name: misc-gpt-ui
description: Design and extend the MISC engineering platform's ChatGPT-style shell. Use when asked to modify the sidebar, dashboard, navigation structure, or any shell-level UI of the MISC application.
---

# MISC Pro — GPT-Style UI Design System

The MISC Pro engineering estimation platform uses a ChatGPT-exact shell design wrapped around functional engineering modules.

## Core Design Tokens

| Token | Value | Use |
|---|---|---|
| `--gpt-sidebar-bg` | `#202123` | Sidebar background |
| `--gpt-sidebar-hover` | `#2a2b32` | Sidebar item hover |
| `--gpt-accent` | `#10a37f` | Active indicators, CTAs |
| `--gpt-body-bg` | `#f9f9f9` | Main content area |
| `--gpt-surface` | `#ffffff` | Cards, panels |
| `--gpt-border` | `#e5e5e5` | All borders |
| `--gpt-text-primary` | `#0d0d0d` | Primary text |
| `--gpt-text-secondary` | `#6e6e80` | Secondary/muted text |

## Typography

- **UI Font**: DM Sans (Google Fonts). Load with `ital,opsz,wght` axis for 300–700.
- **Data/Mono Font**: Geist Mono — used for project IDs, metrics, calculation values.
- **NEVER use**: Inter, Roboto, Outfit (legacy), Space Grotesk.

## Shell Architecture

```
app-shell (flex row, 100vh)
├── aside.sidebar (260px, collapsible to 0)
│   ├── .sidebar-top          — brand icon + collapse button
│   ├── .sidebar-quick-actions — New Estimation, Search
│   ├── nav.sidebar-nav       — Navigation + Projects + Recent Estimations + Sign Out
│   └── .sidebar-footer       — user avatar + name + role
└── div.main-content (flex: 1)
    ├── header.top-header (52px) — "MISC Pro ▾" + breadcrumb + actions
    └── main.workspace           — page content (children)
```

## Key Sidebar Classes

- `.sidebar-item` — nav buttons (Dashboard, Projects, New Estimation, Reports)
- `.sidebar-sub-item` — estimation sub-items (indented 32px)
- `.sidebar-project-item` — real project rows (fetched from API)
- `.sidebar-recent-item` — recent estimation rows
- `.sidebar-quick-btn` — large action buttons at top
- `.sidebar-section-title` — section headers ("Navigation", "Projects", "Recent Estimations")
- `.sidebar-item.active::before` — 2.5px green left-border accent

## Dashboard Home Screen

The `/dashboard` route renders a GPT-style center greeting before the data:

```jsx
<div className="dash-home">
  <h1 className="dash-greeting">Ready when you are.</h1>
  <TabBar navigate={navigate} />        // pill tab bar
  <div className="dash-divider" />
</div>
```

### Pill Tab Bar (`.dash-tab-bar`)

- Container: white background, `1.5px` border, `border-radius: 999px`, subtle shadow
- Tabs: `padding: 8px 18px`, `border-radius: 999px`
- Active tab: `background: #0d0d0d`, `color: white`
- "New Estimation" has a hover dropdown with 4 estimation type options

## Data Fetching Pattern (Sidebar Projects)

The sidebar fetches real project data via `useEstimation()`:

```jsx
const { estimations, fetchEstimations } = useEstimation();
useEffect(() => { fetchEstimations(); }, []);
const recentProjects = estimations.slice(0, 5);
```

Projects are displayed as `.sidebar-project-item` rows navigating to `/project-info?id=<id>`.

## Sacred Rules — Do NOT Break

1. **Never modify** `StairConfig.jsx`, `StairFlight.jsx`, or `SFEEstimateReport.jsx` for UI-only tasks.
2. **Never modify** any context (`AuthContext`, `EstimationContext`) or API files for UI tasks.
3. **All form CSS classes** (`.form-input`, `.form-select`, `.collapsible-section`, `.form-grid-*`, `.data-type-*`, `.eng-table`) MUST remain untouched because they are used by the estimation engine UI.
4. The sidebar starts **expanded by default** (`collapsed = false`).
5. The GPT accent green `#10a37f` is used ONLY for active indicators and CTA buttons — not as a primary surface color.

## Extending the Sidebar

To add a new nav section:
1. Add entry to `NAV_ITEMS` array in `MainLayout.jsx`
2. If it has sub-routes, add `children[]` with paths
3. Add matching breadcrumb in `buildCrumbs(path)` helper
4. The collapsible uses `AnimatePresence` + `motion.div` with `height: 0 → auto`

## File Map

| File | Purpose |
|---|---|
| `client/src/layouts/MainLayout.jsx` | GPT sidebar + header shell |
| `client/src/styles/globals.css` | All CSS variables + shell styles + engineering form styles |
| `client/src/modules/Stair/StairConfig.css` | Deep form re-skin for estimation page — all `.form-*`, `.radio-option`, `.collapsible-*`, `.arch-input` etc. |
| `client/src/pages/Dashboard/Dashboard.jsx` | Home screen with greeting + tab bar + data grid |
| `client/src/pages/Dashboard/EstimationDashboard.css` | Dashboard-specific styles only |
| `client/src/routes/AppRoutes.jsx` | Route definitions (update when adding pages) |
