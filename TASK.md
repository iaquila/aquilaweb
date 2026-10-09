# Task: Gold-Standard Mobile App UI/UX Redesign & Specification Alignment

## Overview
- Ground all work on local base `9e64bf9` (discarding broken AI Studio artifacts from `23de3de`).
- Deliver a comprehensive, state-of-the-art 2026/2027 Expo React Native mobile UI/UX redesign.
- Eliminate generic layouts, double paddings, margins, and nested scroll issues.
- Align all domain features with the audio specification (Parts 1-9) & PRD:
  1. Multi-tenancy Organization in Authentication
  2. Candidate Entity vs. Party Modeling & History
  3. AI Projection Engine (0: 2023, 1: 2019, 2: Combined) + Disclaimer
  4. Live Election Pulse Simulation (15-30s periodic polling)
  5. Drafts vs. Published Results Workflow (Live badge, submit, publish)
  6. Field Agent 3 Assigned Polling Units Demo
  7. Strict Live Media Capture (No gallery, covert flash/sound defaults, 2-min auto-save)
  8. Incident Triage Workflow (Reviewing / Resolved) + Category Filters
  9. Electoral Location Hierarchy Autocomplete (Qualified by parent state)
  10. Full Candidate Collation & Detail Results View

## Progress Checklist
- [x] 1. Clean working state based on `9e64bf9` and preserve brand assets
- [x] 2. Audit and enhance Theme & Tokens (`constants/colors.ts`, `constants/tokens.ts`)
- [x] 3. Audit and enhance Data Models & Stores (`features/auth/store.tsx`, `features/elections/service.ts`, `features/elections/hooks.ts`)
- [x] 4. Redesign Auth Screen with Multi-Tenancy (`app/(auth)/login.tsx`)
- [x] 5. Redesign Dashboard (`app/(app)/(tabs)/index.tsx`) with Live Pulse, AI Projection, Drafts alert, Assigned PUs, and Candidate Snapshot
- [x] 6. Redesign Results Screen & Workflows (`results.tsx`, `result-drafts.tsx`, `result-detail.tsx`, `result-submit.tsx`, `result-collation.tsx`)
- [x] 7. Redesign Incident Screen & Live Capture (`incidents.tsx`, `incident-report.tsx`, `incident-search.tsx`)
- [x] 8. Redesign Locations & Picker (`locations.tsx`, `pu-picker.tsx`)
- [x] 9. Polish Parties, Elections, Profile (`parties.tsx`, `elections.tsx`, `election-detail.tsx`, `profile.tsx`)
- [x] 10. Audit double margins/paddings, nested virtualized lists, run `npx tsc --noEmit` and verify invariants.

## Verification Status
- Staff Invariant Audit: INVARIANTS VERIFIED
- `npx tsc --noEmit`: Exited with code 0 (clean, 0 errors).
- Double padding/margin: Eliminated across all `Card` instances, `ScreenView` padding, and outer container styling.
- Virtualized list nesting: Eliminated across all `FlashList` instances by converting parents to `ScreenView scrollable={false} noScrollPadding`.
- Audio specification alignment: Fully integrated across parts 1–9.
- Feedback Corrections (Safe Area, Roles, Gestures, Flash, Audio Crash):
  * Dynamic Island & Tab Bar Safe Area: Fixed in `ScreenView.tsx` to apply `insets.top` on tabs/auth screens and `insets.top + 44` on non-scrollable push screens on iOS, preventing UI from sliding under the Dynamic Island. Added `paddingBottom: 110` to FlashLists and scrollable tab views to prevent items clipping behind the bottom tab bar.
  * Agent Titles & Roles: Strictly aligned with `Aquila PRD.pdf` (Page 12-14) — `Field Agent`, `Polling Unit Agent`, and `Election Officer`. Differentiated dashboard and submission behavior per role (PU Agent restricted to sole PU; Election Officer given supervisory view-only overview).
  * Slide-back Prevention: Set `gestureEnabled: false` on root Stack, `(auth)`, `(app)`, and `(tabs)`.
  * Theme Synchronization & SystemUI: Removed static `SystemUI.setBackgroundColorAsync` to eliminate native window decor interference on push/deep-nested screens. All screens use dynamic `useStatusBar({ barStyle: scheme === 'dark' ? 'light' : 'dark' })`.
  * Incident Report Audio Crash: Fixed `ExpoModulesCore` Swift `NotFoundException` in `incident-report.tsx` by replacing direct `recorderRef.current.isRecording` getter calls with `isRecordingRef` JavaScript boolean synchronization.
  * List Architecture (FlashList -> Built-in FlatList): Fully transitioned from `@shopify/flash-list` to React Native's built-in `FlatList` across `results`, `incidents`, `pu-picker`, `parties`, `election-detail`, and search screens. Solved the screen detach offset reset bug and scroll repositioning on `goBack()`.
  * Native Header & Inset Alignment: Push screens use clean native Stack headers (`headerTransparent: true` on iOS with zero blur effect; native toolbar matching `colors.background` on Android). Duplicate in-screen headings removed from `incident-report` and `pu-picker`.
  * Elections Tab Filter Pills: Replaced oversized `<Button>` elements with sleek, compact horizontal filter chips (`cycleChip`).
  * Live Status Badge & Pulse Cleanup: Replaced debug `PULSE #<tick>` counter and manual pause/step controls in Header with clean production `LIVE · Synced` indicator and `LIVE COLLATION` status badges.
  * Station Console Header Compaction & Multi-Viewport Adaptability: Reduced station console vertical height by ~45% (desktop merges into single horizontal command strip; mobile splits into 2 ergonomic tiers with compact badges and auto-scaled metrics). Verified responsiveness across 320px–430px phones, 768px–1024px tablets, and desktop/ultrawide displays.
  * Station Console Dead Zone Elimination: Converted desktop container to `w-fit` with tight inter-metric spacing (`gap-6 lg:gap-8`) and vertical divider, eliminating horizontal dead zone across ultra-wide viewports while preserving edge-to-edge flow on mobile.
  * Root Cleanup (Web Monolith Focus): Removed legacy Expo/React Native mobile artifacts (`app/`, `core/`, `features/`, `constants/`, `types/`, `scripts/`, `app.json`, `eas.json`, `metro.config.cjs`, `babel.config.js`, `expo-env.d.ts`). Verified Vite web build and TS compilation remain 100% operational with 0 errors.
  * Legal URLs & Subdomain Alignment: Fixed in-app legal links across `App.tsx` and `LoginView.tsx` to point directly to `https://iaquila.com.ng/{privacy,terms,deletion,support}.html` (main domain, returning HTTP 200), eliminating the invalid `app.` prefix that triggered 404s on the web app subdomain.
  * Brand Logo Favicon Correction: Restored the authentic iAquila green eagle-head brand mark for `favicon.png` across both `public/assets/` and root `assets/`, replacing the stale 268-byte generic Expo triangle icon. Configured `apple-touch-icon` in `index.html`.
  * Public Directory Restoration (Without Landing or Duplicate HTML): Restored `public/` directory containing `.htaccess` (with 301 redirect rules to `https://iaquila.com.ng` where cPanel's `public_html` serves the canonical documents, plus LiteSpeed SPA rewrite rules and caching) and authentic brand assets in `public/assets/`, keeping legacy `landing/` and redundant HTML copies removed.
  * CI/CD Modernization: Upgraded GitHub Actions (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`, `SamKirkland/FTP-Deploy-Action@v4.4.0`) across `.github/workflows/{ci,deploy,deploy-cpanel}.yml` to target Node 24 natively, completely eliminating deprecated Node 20 runner warnings.

  * Mobile Viewport Horizontal Scroll Elimination: Diagnosed DOM layout on mobile viewports (<580px down to 320px). Identified `Header.tsx` as sole root cause expanding `scrollWidth` from 360px to 579px due to uncollapsed inline CTA buttons ("Submit", "Incident", "Drafts Queue") and the "2027 ELECTION" badge. Refined Header to compact icon-only CTA buttons on `<sm` screens, tuned paddings, added `w-[min(20rem,calc(100vw-2rem))]` to role switcher dropdown, added `min-w-0` to `<main>`, and applied `overflow-x: clip` on `html, body`. DOM verification across all 7 views confirmed `scrollWidth: 320/360px` matching `clientWidth: 320/360px` with 0 horizontal scroll.
  * Deployment Pipeline Cleanup: Removed redundant `.github/workflows/deploy.yml` (GitHub Pages) in favor of the production-targeted cPanel FTP deployment pipeline (`.github/workflows/deploy-cpanel.yml`).

  * Field Agent & Polling Unit Agent Dashboard Streamlining: Removed AI Projection engine and tactical Heat Map from the Dashboard view for `FIELD_AGENT` and `POLLING_AGENT` (`!isOfficerOrAbove`), making Candidate Snapshot Performance span full-width and keeping executive simulation and geospatial maps reserved for Election Officers and above.
  * Election Officer Dashboard Reorganization:
    - Removed `Status ACTIVE` and `LIVE COLLATION` badges from the station console header for Election Officers, eliminating dead space.
    - Moved Candidate Snapshot Performance horizontally into the header row across 4 candidate cards with candidate selection wiring for AI projection.
    - Repositioned the Compact Tactical Heat Map and AI Election Projection Engine side-by-side in a 2-column grid (`grid grid-cols-1 lg:grid-cols-2`), cutting the Heat Map width to 50% on desktop as specified in the architectural sketch.
    - Aligned candidate name and party representation across both Snapshot Performance and AI Projection to `{fullName} ({partyAcronym})`.
  * Constants & SSOT Centralization:
    - Extracted all political party color mappings and election constants into `src/constants/parties.ts`, `src/constants/timing.ts`, and `src/constants/index.ts`.
    - Eliminated duplicate `PARTY_COLORS` definitions across `DashboardView.tsx`, `PartiesView.tsx`, and `NigeriaHeatMap.tsx`.
  * Skeleton Shimmer & Loading Architecture:
    - Configured `@keyframes shimmer` and `.animate-shimmer` utility in `src/index.css`.
    - Implemented high-fidelity `Skeleton`, `CardSkeleton`, `MetricsSkeleton`, and `TableSkeleton` suite with light-sweep gradient animation in `src/components/Skeleton.tsx`.
  * Interaction & Navigation Debouncing:
    - Created `useDebouncedCallback` and `DebouncedButton` with standard 300ms leading-edge cooldown.
    - Debounced tab navigation in `Navigation.tsx` and modal triggers (Submit Result, Report Incident, Drafts Queue, Brand Home) in `Header.tsx`.
  * Container Primitive Standardization:
    - Created reusable `<Card>` primitive (`default`, `highlighted`, `elevated`, `subtle`) matching the design system and refactored container sections.
  * Layout Compaction & Dead Space Elimination:
    - Election Officer Station Console Header: Transitioned header flex-row trigger from `2xl:flex-row` (which never triggered inside `max-w-7xl`) to `xl:flex-row`. Candidate Snapshot Performance cards now merge into a single horizontal telemetry row with the station status on desktop displays, eliminating vertical dead space.
    - Quick Actions Grid Compaction: Refactored bulky vertical 2x2 cards into sleek, ergonomic horizontal action buttons with compact left-aligned icon badges and single-line typography. Reduced height by ~50% (from 240px to 126px), balancing the vertical height of the right column with the `Assigned Polling Units` list on the left.
    - Field Agent Header Symmetry: Converted `w-fit` header container to `w-full` with balanced horizontal telemetry alignment across desktop and mobile, eliminating the empty void on the right of the header.

  * Gold-Standard UX & Architectural Anti-Pattern Resolution:
    - Modal Accessibility & Body Scroll Lock (`useModalA11y`): Created reusable hook managing `document.body.style.overflow = 'hidden'` on mount (restoring on unmount) and listening for `Escape` key dismissal. Implemented backdrop click-to-close with `e.stopPropagation()` on dialog cards across all 5 modals (`SubmitResultModal`, `ReportIncidentModal`, `DraftsQueueModal`, `ResultDetailModal`, `IncidentDetailModal`).
    - Form EC8A Real-Time Telemetry Meter & Mutation Guard: Added live Accreditation Balance Tally Meter and dynamic progress bar in `SubmitResultModal.tsx` comparing total recorded votes against accredited voters (remaining, balanced, exceeded states). Added double-submission cooldown guards (`isSubmitting`) with `<Loader2>` spinning indicators across result submissions and incident reports.
    - Navigation Intent Handoff: Added consumable PU filter pattern (`selectedPuFilter`, `setSelectedPuFilter`, `consumePuFilter`) in `src/store/index.ts`. Clicking "Audit" or "View" on assigned polling units in `DashboardView.tsx` directly opens the Form EC8A audit modal if result exists, or navigates to `ResultsView.tsx` with the filter pre-applied and atomically consumed.
    - Component Primitive SSOT: Replaced ad-hoc raw border/bg divs with centralized `<Card>` primitives across all secondary views (`ResultsView.tsx`, `IncidentsView.tsx`, `PartiesView.tsx`, `ElectionsView.tsx`, `LocationsView.tsx`).

## Verification Status
Staff Invariant Audit: INVARIANTS VERIFIED
- `tsc --noEmit`: Exited with code 0 (clean, 0 type errors).
- `vite build`: Clean production bundle built successfully in 6.28s.
- Multi-viewport DOM verification: 0 horizontal overflow (`scrollWidth === clientWidth`) across 360px, 375px, 768px, and 1440px displays.
- Modal & Interaction Verification: Verified via DevTools on port 3002:
  * Modal open locks `bodyOverflow: "hidden"`.
  * Real-time tally meter dynamically tracks remaining ballots (`645 / 650`).
  * `Escape` key dismisses modal and restores `bodyOverflow: ""`.
  * Backdrop click dismisses modal and restores `bodyOverflow: ""`.
- Visual Ergonomics: Header height reduced to 104px single row on desktop; Quick Actions reduced to 126px; 0 dead voids across viewports.

