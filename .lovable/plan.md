# Plan - iPhone 17 Pro Video Compatibility Fix

The goal is to resolve video loading failures on mobile devices (specifically iPhone 17 Pro) by standardizing video attributes and ensuring muted autoplay compliance across all video players.

## User Review Required

- **Video Storage**: Are all video files hosted on Supabase Storage or an external CDN like Google Drive/YouTube? (We have logic for both, but knowing the primary source helps optimize pre-buffering).
- **iPhone 17 Pro Specifics**: The user reported issues on an "iPhone 17 Pro". While this device is very new, it follows the same WebKit/Safari autoplay policies as previous models.

## Proposed Changes

### 1. Standardize Video Component Attributes
Update `VideoPlayer.tsx` and `StoryPlayer.tsx` to include all mobile-required attributes:
- `playsInline`: Prevents automatic full-screen on iPhone.
- `muted`: Required for autoplay.
- `webkit-playsinline`: Legacy WebKit support.
- `x5-playsinline`: Support for some Android browsers.
- `preload="metadata"`: Ensures basic info is loaded without stalling the main thread.

### 2. Landing Page Video Fix
- Modify the Hero section in `src/routes/index.tsx` to ensure the VideoPlayer is initialized with the correct mobile flags.
- Optimize the `VideoPlayer` to handle Google Drive preview links more robustly for mobile by adding specific parameters (`&playsinline=1`).

### 3. iPhone Viewport & User-Agent Compliance
- Ensure `src/routes/__root.tsx` has correct viewport tags (already improved in previous tasks, but will double-check for iPhone 17 Pro specific scaling).

## Technical Details

- **Muted Autoplay Logic**: Browsers block audio-enabled autoplay. We will enforce `video.muted = true` on initial load and use a "Tap to Unmute" overlay for user-initiated audio.
- **playsinline**: Essential for iOS Safari to keep the video within the layout instead of launching the native full-screen player immediately.

### Verification Plan

- **Automated Simulation**: Run a Playwright script with an iPhone 17 Pro user-agent and viewport (393x852) to verify:
  1. `video` elements are present in the DOM.
  2. `readyState` is > 0 (metadata loaded).
  3. `paused` is false (if intro/autoplay).
- **Manual Verification**: Check the preview at different resolutions.
