---
name: Technical Audit and Optimization Plan
description: Comprehensive audit for bug fixing, performance optimization, and cross-device compatibility.
type: feature
---

# Technical Audit and Optimization Plan

## Phase 1: Diagnostic & Triage
- [ ] **Static Analysis**: Run `npm run build:dev` and check for TypeScript errors.
- [ ] **Runtime Audit**: Systematically visit all routes (public, app, admin) and capture console errors/warnings.
- [ ] **Broken Links & Routes**: Verify all internal links, button navigations, and 404 handling.
- [ ] **RLS & Backend Validation**: Inspect Supabase calls for silent failures or permission errors.
- [ ] **UX States**: Identify missing loading, empty, and error feedback states.
- [ ] **Performance bottlenecks**: Check for stable list keys and N+1 query patterns.
- [ ] **Data Integrity**: Audit forms for validation and persistence.

## Phase 2: Implementation & Fixes
- [ ] **Critical Fixes**: Address build-breaking errors and RLS failures.
- [ ] **High Priority**: Fix broken navigation and data-saving issues.
- [ ] **Compatibility Overhaul**:
    - [ ] Screen widths: 360px to 1440px.
    - [ ] Overflow control (Zero horizontal scroll).
    - [ ] Safe area implementation (`h-dvh`, `safe-area-inset`).
    - [ ] Touch targets (min 44x44px) and iOS auto-zoom prevention (font >= 16px).
    - [ ] Responsive UI patterns (Bottom sheets for mobile, Cards for tables).
- [ ] **Video Player Standards**:
    - [ ] Attributes: `playsInline`, `controls`, `preload="metadata"`, `poster`.
    - [ ] Layout: Fluid `aspect-video` containers.
    - [ ] Feature: Playback position persistence.
- [ ] **Performance & SEO**:
    - [ ] Route-based code splitting and skeletons.
    - [ ] Image lazy loading and aspect-ratio optimization.

## Phase 3: Validation & Reporting
- [ ] **Browser Testing**: Verify Safari iOS 16+, Chrome Android, Firefox, and Desktop.
- [ ] **Lighthouse Audit**: Aim for ≥85 performance score.
- [ ] **Final Execution Report**: Document bugs found, fixes applied, and modified files.
