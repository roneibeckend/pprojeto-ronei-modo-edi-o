# Plan - Fix eBook Progress on Course Page

Fix the logic in `use-progress.ts` to ensure that eBooks are correctly counted as "started" in the student dashboard, and ensure consistent progress tracking for both courses and eBooks.

## User Review Required

> [!IMPORTANT]
> This change will update the "Started" counter on the `/app/cursos` page to include eBooks that the user has opened at least once.

## Proposed Changes

### Progress Tracking Logic
- Update `src/hooks/use-progress.ts` to improve how `startedCount` and `finishedCount` are calculated.
- Ensure that `ebook` item types are correctly filtered from `progress_tracking`.
- Add a mechanism to trigger `progress_tracking` for eBooks if it's missing (similar to how lessons do it).

### Route Integration
- Verify `src/routes/app.ebooks.$ebookId.tsx` to ensure it correctly calls the progress tracking functions when a chapter is read.
- Verify `src/routes/app.cursos.$courseId.tsx` for consistency.

## Technical Details
- **Hook Modification**: In `use-progress.ts`, I'll refine the `startedCount` filter to strictly match `item_type === 'course'` or `item_type === 'ebook'`.
- **Progress Tracking Update**:
    - In `completeChapterMutation` (within `use-progress.ts`), I will verify if the `ebookId` is being used to upsert a `progress_tracking` record with `item_type: 'ebook'`.
    - I'll do the same for `toggleLessonMutation` for courses.

## Verification Plan
- **Manual Verification**: I will check the `/app/cursos` route in the preview to see if the "Iniciados" count reflects both started courses and ebooks.
- **Data Integrity**: Ensure RLS policies allow the upsert into `progress_tracking` for standard users (this was partially handled in previous tasks, but I'll double-check).
