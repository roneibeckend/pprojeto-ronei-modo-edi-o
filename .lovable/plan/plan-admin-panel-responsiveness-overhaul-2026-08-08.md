---
name: Admin Panel Responsiveness
description: Comprehensive plan to optimize the administrative area for mobile devices.
type: feature
---

# Plan - Admin Panel Responsiveness Overhaul

The administrative panel currently has significant layout issues on mobile devices. The sidebar remains visible, taking up more than 50% of the screen, and internal contents (tables, grids, headers) do not adapt correctly.

## 1. Sidebar and Navigation (`src/routes/admin.tsx`)
- [ ] **Mobile Sidebar**: Replace the fixed sidebar with a collapsible mobile version on small screens.
- [ ] **Hamburger Menu**: Add a mobile-only header with a menu button to toggle the sidebar.
- [ ] **Sheet/Drawer Pattern**: Use a slide-in drawer for navigation on mobile.
- [ ] **Header Optimization**: Reduce padding and font sizes of the admin header on mobile.

## 2. Dashboard (`src/routes/admin.index.tsx`)
- [ ] **Stat Cards**: Ensure cards stack in a single column on mobile.
- [ ] **Grid Layouts**: Adjust column spans for "Quick Shortcuts" and "System Health" to stack correctly.
- [ ] **Padding**: Standardize spacing for mobile view.

## 3. Financial Area (`src/routes/admin.financeiro.tsx`)
- [ ] **Summary Cards**: Stack the 4 metrics (Revenue, Costs, Profit, Margin).
- [ ] **Forms and Inputs**: Ensure inputs are full-width and touch-friendly.
- [ ] **Action Buttons**: Stack buttons ("Distribute Profits", "Save Settings") on mobile.
- [ ] **Partners and Costs Sections**: Adjust layouts from side-by-side to vertical stack.

## 4. Courses and Content (`src/routes/admin.cursos.tsx`, `src/routes/admin.receitas.tsx`)
- [ ] **Table to Card Conversion**: Refactor tables to display as cards on small screens (or add horizontal scroll as a fallback).
- [ ] **Search and Filters**: Stack controls vertically on mobile.
- [ ] **Modals**: Ensure the course editor modal is full-screen and scrollable on mobile.

## 5. Support Central (`src/routes/admin.suporte.tsx`)
- [ ] **Master-Detail Flow**: Show the ticket list and ticket detail one at a time on mobile using a navigation state.
- [ ] **Chat Layout**: Optimize message bubbles and reply input for small screens.

## 6. Global Fixes
- [ ] **Touch Targets**: Ensure all buttons and icons have at least 44x44px hit area.
- [ ] **Font Sizes**: Prevent browser zoom on inputs by ensuring font-size is at least 16px.
- [ ] **Viewport Units**: Use `dvh` for full-height layouts.
