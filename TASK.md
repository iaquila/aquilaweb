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

## Verification Status
Staff Invariant Audit: INVARIANTS VERIFIED
- `tsc --noEmit`: Exited with code 0.
- `vite build`: Clean production bundle built successfully (dist includes `.htaccess` with 301 legal redirects, and brand eagle head assets).
- Curl verification: All legal endpoints on `https://iaquila.com.ng` verified HTTP 200.
- Chrome DevTools Mobile Viewport Audit: Verified 0 horizontal overflow across 320px, 360px, 375px, 390px, and 412px viewports.
