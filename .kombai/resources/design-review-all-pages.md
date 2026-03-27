# Design Review Results: All Pages — MISCStairPro / SteelSpec

**Review Date**: 2026-03-25  
**Routes Reviewed**: `/login`, `/home`, `/dashboard`, `/project-info`, `/project-history`, `/estimate/stair-railings`, `/reports`, `/admin/dictionary`, `/costing`, `/final-estimate`  
**Focus Areas**: All — Visual Design, UX/Usability, Responsive/Mobile, Accessibility, Micro-interactions, Consistency, Performance

---

## Summary

The application has two completely separate UI paradigms that are never unified: legacy pages (`/home`, `/dashboard`) use a colorful icon-grid sidebar branded "MISCStairPro", while new engineering pages (`/project-info`, `/estimate/*`, `/reports`) use a compact text sidebar branded "SteelSpec". This brand and layout split is the single most critical issue. Beyond that, raw HTML inputs are used throughout instead of the project's own MUI/Tailwind system, several key pages are stubs, and the login page ships a 2 MB Three.js bundle on the critical path. Performance, accessibility, and mobile responsiveness all need significant attention.

---

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | **Two completely different sidebar/layout systems coexist** — `/home` and `/dashboard` render a colorful icon-grid `Sidebar.jsx`; all engineering pages render a plain text `MainLayout.jsx`. Users experience a jarring navigation reset between pages. | 🔴 Critical | Consistency | `src/components/dashboard/Sidebar.jsx` vs `src/components/layout/MainLayout.jsx` |
| 2 | **Brand name split: "MISCStairPro" vs "SteelSpec"** — Login and Home say "MISCStairPro"; every MainLayout page says "SteelSpec". There is no single product identity. | 🔴 Critical | Consistency | `src/components/auth/Login.jsx:422` vs `src/components/layout/MainLayout.jsx:94` |
| 3 | **"Project Database" quick-access card navigates to `/projects` which has no route** — the app silently redirects to `/dashboard` (fallback route), breaking the intended flow. | 🔴 Critical | UX/Usability | `src/components/dashboard/Home.jsx:62` |
| 4 | **`/final-estimate` is a placeholder stub** — the component renders "This module is under development." with no structure or roadmap hint. It is linked in navigation but unusable. | 🔴 Critical | UX/Usability | `src/components/estimation/FinalEstimate.jsx:3-10` |
| 5 | **`/api/auth/verify` returns 401 on every page load** — the token stored after login is rejected by the server's verify endpoint, producing repeated console errors. The app degrades gracefully but users are unauthenticated on reload. | 🔴 Critical | Performance | `src/contexts/AuthContext.jsx:24-38` |
| 6 | **Login page ships ≈2 MB JavaScript bundle** — Three.js + `@react-three/fiber` + `@react-three/drei` are imported directly in the login page component, making first-contentful paint extremely heavy. `pageSize: 2,048,961 bytes`. | 🟠 High | Performance | `src/components/auth/Login.jsx:4-6` |
| 7 | **No mobile responsive layout for MainLayout sidebar** — `sidebar { width: 260px }` is fixed. There is no hamburger toggle, no collapse mechanism, and no media query narrower than 900px for the sidebar. Content is cut off on phones. | 🟠 High | Responsive/Mobile | `src/styles/globals.css:95-103`, `src/components/layout/MainLayout.jsx:91-167` |
| 8 | **Raw `<input>`, `<select>`, and `<button>` elements used throughout** — Login form, Project Info, and Estimation forms bypass the MUI component library entirely. No ARIA roles, no WCAG-compliant focus rings, no error states. | 🟠 High | Accessibility | `src/components/auth/Login.jsx:710-815`, `src/components/project/ProjectInfo.jsx` |
| 9 | **No keyboard navigation on sidebar `<div>` items** — `MainLayout` nav items are plain `<div>` elements with `onClick`. They are not focusable via Tab, have no `role="button"`, `tabIndex`, or `onKeyDown` handler. | 🟠 High | Accessibility | `src/components/layout/MainLayout.jsx:105-145` |
| 10 | **`cursor-none` CSS class applied to entire Home page body** — this disables the native OS cursor, which is an anti-pattern for a productivity tool and creates confusion for users not familiar with the custom cursor effect. | 🟠 High | UX/Usability | `src/components/dashboard/Home.jsx:100` |
| 11 | **Dashboard KPI data is entirely hardcoded** — "$2,485k", "142.5T", "1,250 Hrs", win rates, chart data, and AI recommendations are all static strings. The dashboard provides no real operational value and may mislead users. | 🟠 High | UX/Usability | `src/components/dashboard/Dashboard.jsx:119-160` |
| 12 | **Form inputs lack validation feedback and ARIA attributes** — no `aria-invalid`, `aria-errormessage`, or `aria-required` attributes on any input field. Required field errors are not announced to screen readers. | 🟠 High | Accessibility | `src/components/auth/Login.jsx:705-831` |
| 13 | **Stair estimation page has 3 conflicting button styles in one view** — the header has an orange "Save Changes" button (amber gradient), a dark-green "+ Add Stair" button, and the floating footer bar has teal buttons ("Save Assembly", "Excel BOM"). | 🟡 Medium | Consistency | `src/components/estimation/StairEstimation.jsx` |
| 14 | **Reports export buttons (`Export PDF`, `Export Excel`) have no click handlers** — they render with `id` attributes only; clicking does nothing. Users expect exports to work. | 🟡 Medium | UX/Usability | `src/components/reports/Reports.jsx:31-32` |
| 15 | **Emoji icons used in professional engineering UI** — `📦`, `📐`, `🏭`, `👤`, `🏗`, `⚙` appear in report type labels and project section headers. These render inconsistently across OS, are not scalable, and feel unprofessional. Replace with Lucide or MUI icons. | 🟡 Medium | Visual Design | `src/components/reports/Reports.jsx:5-10`, `src/components/project/ProjectInfo.jsx` |
| 16 | **"Forgot password?" links to `href="#"` — completely non-functional** — no reset flow, modal, or redirect exists. Users are left with a dead link. | 🟡 Medium | UX/Usability | `src/components/auth/Login.jsx:799` |
| 17 | **Breadcrumb shows "SteelSpec › Dashboard" for unmapped routes** — `buildCrumbs()` fallback returns `['Dashboard']`, so `/project-history` shows the wrong breadcrumb ("SteelSpec › Dashboard" instead of "Project History"). | 🟡 Medium | UX/Usability | `src/components/layout/MainLayout.jsx:208-218` |
| 18 | **Dashboard header is visually fragmented into 3 competing sections** — a large icon block + product title, a toggle button group, and an icon strip + search bar + avatar all fight for horizontal space. On medium viewports they overflow or wrap inconsistently. | 🟡 Medium | Visual Design | `src/components/dashboard/Dashboard.jsx:24-68` |
| 19 | **"NEURAL ANALYTICS" micro-copy aesthetic is mismatched to engineering context** — extreme uppercase tracking (`tracking-[0.2em]`), `font-black` weights at 10px, and "Live Fabrication Engine" badge evoke gaming dashboards rather than professional engineering tooling. | 🟡 Medium | Visual Design | `src/components/dashboard/Dashboard.jsx:29-35` |
| 20 | **`animate-blob` and `animation-delay-2000` classes are used but never defined** — Home page uses these Tailwind-like utility classes, but they are not in `globals.css` or `tailwind.config.js`. The blobs simply do not animate. | 🟡 Medium | Micro-interactions | `src/components/dashboard/Home.jsx:116-118` |
| 21 | **Unsplash image for "Recent Reports" card blocked at runtime (ERR_BLOCKED_BY_ORB)** — `photo-1581094794329-cd119653243f` is CORS-blocked in the Chromium browser, leaving the third quick-access card broken (broken image icon visible). | 🟡 Medium | Visual Design | `src/components/dashboard/Home.jsx:72` |
| 22 | **Welcome message displays "Welcome back, User!"** — `user.name` is `null` post-login (not stored in JWT or user object), so the greeting always falls back to the literal string "User!". | 🟡 Medium | UX/Usability | `src/components/dashboard/Home.jsx:136` |
| 23 | **CLS of 0.039 detected on `/estimate/stair-railings`** — cumulative layout shift caused by late-loading content or dynamic form elements shifting layout during hydration. Exceeds Google's "good" threshold of 0.1 is not violated but is still measurable. | 🟡 Medium | Performance | `/estimate/stair-railings` page runtime |
| 24 | **Floating action bar on stair estimation overlaps form content** — the dark `position: fixed` bottom bar (Save Assembly / Excel BOM / Run Estimation) covers the last rows of the stair configuration form without sufficient padding-bottom on the content container. | 🟡 Medium | UX/Usability | `src/components/estimation/StairEstimation.jsx` |
| 25 | **Logo `onError` fallback uses direct DOM style manipulation** — `e.target.style.display = 'none'` and `e.target.nextSibling.style.display = 'block'` bypass React's rendering model and can cause hydration issues; use React state instead. | ⚪ Low | Micro-interactions | `src/components/auth/Login.jsx:413-416` |
| 26 | **3D assembly animation runs indefinitely on the login page** — the `setInterval` in `animateAssembly()` restarts with `setTimeout` on completion, continuously consuming CPU even while the user is filling the form. Should pause when form is focused. | ⚪ Low | Performance | `src/components/auth/Login.jsx:325-368` |
| 27 | **Login `assemblyPhases` array is mutated directly** — `assemblyPhases[n].status = 'complete'` inside the interval mutates a constant array reference without React state. This works by side-effect only and could cause subtle bugs. | ⚪ Low | Performance | `src/components/auth/Login.jsx:335-354` |
| 28 | **No `<title>` or `<meta>` updates on route changes** — all pages share the same HTML `<title>` ("steel-estimation-client"). Screen readers and browser tabs always announce the same page name regardless of route. | ⚪ Low | Accessibility | `client/public/index.html` |

---

## Criticality Legend

- 🔴 **Critical**: Breaks functionality or violates accessibility standards
- 🟠 **High**: Significantly impacts user experience or design quality
- 🟡 **Medium**: Noticeable issue that should be addressed
- ⚪ **Low**: Nice-to-have improvement

---

## Issue Summary by Focus Area

| Focus Area | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| Consistency | 2 | 1 | 2 | 0 | **5** |
| UX/Usability | 2 | 2 | 5 | 0 | **9** |
| Accessibility | 0 | 3 | 0 | 1 | **4** |
| Visual Design | 0 | 0 | 4 | 0 | **4** |
| Performance | 1 | 1 | 1 | 2 | **5** |
| Responsive | 0 | 1 | 0 | 0 | **1** |
| Micro-interactions | 0 | 0 | 1 | 1 | **2** |
| **Total** | **5** | **8** | **13** | **4** | **28** |

---

## Next Steps (Prioritized)

### Phase 1 — Critical Fixes (unblock core usage)
1. **Unify navigation** — Retire `Sidebar.jsx` and migrate `/home` + `/dashboard` into `MainLayout.jsx`. Apply one brand name throughout.
2. **Fix the `/projects` broken route** — Change the "Project Database" card to link to `/project-history` or create the missing route.
3. **Fix `auth/verify` 401** — Debug token format expected by the server's verify endpoint and align the JWT payload.
4. **Implement `/final-estimate`** — At minimum replace the stub with a meaningful "coming soon" card that describes the roadmap.

### Phase 2 — High Impact UX & Accessibility
5. **Replace raw `<input>` elements** — Use MUI `TextField`, `Select`, `Checkbox` throughout Login, ProjectInfo, and Estimation forms.
6. **Add sidebar mobile responsiveness** — Implement a hamburger toggle and drawer overlay for screens < 768px.
7. **Add `tabIndex`, `role`, `onKeyDown` to all nav items** — Make sidebar keyboard navigable.
8. **Remove `cursor-none` from Home page** — It breaks basic usability expectations.

### Phase 3 — Visual Polish & Consistency
9. **Replace all emoji** with Lucide or MUI icons in Reports and ProjectInfo.
10. **Align button colour tokens** — Define `primary`, `secondary`, and `destructive` variants in `globals.css`; use them consistently.
11. **Tone down Dashboard micro-copy** — Replace "NEURAL ANALYTICS" with readable section titles consistent with the rest of the app.
12. **Define `animate-blob` in CSS** — Add the keyframe or remove the class references.

### Phase 4 — Performance
13. **Lazy-load the 3D login component** — Wrap `Login3D`'s Three.js canvas in `React.lazy` + `Suspense`, or move the 3D visualisation to an on-demand overlay.
14. **Pause assembly animation on form focus** — Add a `focus` listener to stop the interval when user is typing.
15. **Audit for Unsplash image CORS** — Self-host or use a proxy for images that fail with ERR_BLOCKED_BY_ORB.
