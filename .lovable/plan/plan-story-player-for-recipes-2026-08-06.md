# Plan: Story Player for Recipes

## 1. Database Schema
- [ ] Add `video_url` column to `recipes` table via migration.
- [ ] Create `recipe-videos` bucket in Supabase Storage.

## 2. Admin Interface (`src/routes/admin.receitas.tsx`)
- [ ] Add Video Upload field to the recipe creation/edition modal.
- [ ] Implement file upload logic to Supabase Storage.
- [ ] Preview for the uploaded video.

## 3. Story Player Component (`src/components/platform/StoryPlayer.tsx`)
- [ ] Create a reusable `StoryPlayer` component.
- [ ] Vertical layout (aspect-ratio 9:16).
- [ ] Auto-play, mute/unmute, and close controls.
- [ ] Progress indicator at the top.

## 4. Student Interface (`src/routes/app.receitas.tsx`)
- [ ] Add a "Watch Story" icon or button to recipe cards if `video_url` exists.
- [ ] Integrate the `StoryPlayer` component.
