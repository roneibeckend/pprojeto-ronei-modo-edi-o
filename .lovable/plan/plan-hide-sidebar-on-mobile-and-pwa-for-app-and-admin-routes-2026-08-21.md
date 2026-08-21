# Plan - Hide Sidebar on Mobile and PWA for /app and /admin routes

The objective is to remove the vertical sidebar in mobile and PWA views for routes starting with `/app` and `/admin`, providing more screen space. Alternative navigation (bottom bar or existing hamburger menu) should be ensured.

## User Review Required

> [!IMPORTANT]
> The current implementation already hides the desktop sidebar on mobile via CSS (`hidden lg:block`). However, on mobile/PWA, it still uses a header with a hamburger menu to access the sidebar items.
> I will implement a **Bottom Navigation Bar** for mobile/PWA users on these routes to replace the need for the sidebar/hamburger menu where appropriate, while keeping the sidebar for desktop.

## Proposed Changes

### Hooks
- Update `usePwaInstall` to expose a simpler `isPwa` check (already has `isStandalone`).

### Components
- Create `src/components/platform/BottomNav.tsx`: A new component for mobile/PWA navigation.
- Update `src/components/platform/Shell.tsx`:
    - Use `useIsMobile` and `usePwaInstall` to detect target environment.
    - Hide the sidebar elements and potentially the hamburger menu in the header for mobile/PWA.
    - Render `BottomNav` at the bottom of the screen for these conditions.
- Update `src/routes/admin.tsx`:
    - Apply similar logic to the admin-specific layout.

### Styling
- Ensure `BottomNav` has `pb-safe` to account for mobile safe areas (home indicator).

## Technical Details

- **Detection**: Use `window.matchMedia('(display-mode: standalone)').matches` and screen width.
- **Route Filtering**: Only apply logic if path starts with `/app` or `/admin`.
- **Navigation Items**:
    - For `/app`: Home, Courses, Recipes, Materials, Profile.
    - For `/admin`: Overview, Finance, Students, Content (Cursos/Ebooks), Menu (More).

## Verification Plan

### Automated Tests
- Run Playwright to simulate mobile viewport and check for:
    - Absence of vertical sidebar.
    - Presence of bottom navigation bar.
    - Functionality of bottom nav links.
- Repeat for PWA standalone mode simulation.

### Manual Verification
- Inspect the live preview in mobile mode.
- Verify that the sidebar is hidden and the bottom nav is visible.
- Ensure that the header hamburger menu is either hidden or redundant.
