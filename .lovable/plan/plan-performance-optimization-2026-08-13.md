# Plan - Performance Optimization

Optimize page load times and mobile user experience through frontend and backend enhancements.

## User Review Required

> [!IMPORTANT]
> - These changes are focused on technical performance and should not alter the visual design of the application.
> - Mobile experience will be prioritized with better asset management and reduced main-thread blocking.

## Proposed Changes

### Frontend Optimization

#### 1. Image and Media Optimization
- Implement `loading="lazy"` on all non-critical images in `src/routes/index.tsx`.
- Add `decoding="async"` to improve rendering performance.
- Ensure all images have explicit `width` and `height` to prevent Layout Shift (CLS).

#### 2. Component and Code Splitting
- Ensure heavy components like `VideoPlayer` and `Onboarding` are loaded lazily where possible.
- Audit `src/routes/index.tsx` for large static sections that can be moved to dedicated files to reduce the main bundle size.

#### 3. UX Performance (Mobile)
- Optimize the `Reveal` component in `src/routes/index.tsx` to use `will-change: opacity, transform` more selectively to avoid GPU memory overhead on mobile.
- Reduce the frequency of `IntersectionObserver` callbacks if they are found to be a bottleneck.

### Backend and Data Fetching

#### 1. Data Prefetching
- Expand the existing prefetching logic in `app.cursos.$courseId.tsx` and `app.ebooks.$ebookId.tsx` to include not just videos but also lesson/chapter metadata.
- Optimize Supabase queries to select only required fields (avoiding `*`).

#### 2. Caching
- Implement TanStack Query stale-time and cache-time optimizations for public content to reduce unnecessary network requests on repeat visits.

## Technical Details

- **Files to Modify:**
  - `src/routes/index.tsx`: Image lazy loading, component splitting.
  - `src/components/platform/VideoPlayer.tsx`: Optimized preloading.
  - `src/routes/app.cursos.$courseId.tsx`: Query optimization.
  - `src/routes/app.ebooks.$ebookId.tsx`: Query optimization.
- **Metrics:** Aiming for higher Lighthouse Performance score by reducing "Initial Server Response Time" and "Largest Contentful Paint".
