# Plan - Fix Mobile Landing Page Initial Rendering

Correct the initial rendering of the Landing Page on mobile devices to ensure the main content is visible immediately without requiring scroll.

## User Review Required

> [!IMPORTANT]
> The fix involves bypassing scroll-triggered animations for elements at the top of the page. This means the Hero section will appear instantly (or with a very fast fade) rather than waiting for a scroll event.

## Proposed Changes

### Animation Logic (`src/routes/index.tsx`)

- Modify the `Reveal` component to detect if an element is likely "above the fold" and trigger visibility immediately.
- Lower the `IntersectionObserver` threshold for mobile to ensure even minimal visibility triggers the animation.
- Increase the `rootMargin` for mobile to "pre-trigger" animations before the user actually reaches the element.

### CSS Optimizations (`src/styles.css`)

- Ensure the `Hero` section has a stable minimum height to prevent layout shifts.
- Verify that `opacity: 0` is correctly transitionable to `opacity: 1` as soon as the component mounts if it's in the first viewport.

## Technical Details

### 1. `Reveal` Component Refactor
I will add a `threshold` and `rootMargin` adjustment specifically for mobile in the `Reveal` component. I will also check if the element is near the top of the document to force visibility.

### 2. Immediate Trigger for Hero
I will identify elements in the `Hero` component and apply a prop (e.g., `immediate`) or use a specific `data-` attribute to bypass the intersection observer for the very first screen.

### 3. CSS "data-visible" State
Currently, `[data-reveal]` is hidden by default. I will ensure that for the first few elements, this state is set to `true` on mount if they are in the initial viewport.

## Verification Plan

### Automated Checks
- Run a Playwright script to:
  1. Load the page at mobile viewport widths (320px to 430px).
  2. Take a screenshot **before** any scroll action.
  3. Verify via OCR or element visibility check that the "Headline" and "CTA" are visible in the first screenshot.

### Manual Verification
- Refresh the page multiple times at different mobile widths.
- Test with "Reduced Motion" enabled in system settings.
- Validate desktop rendering remains unaffected.
