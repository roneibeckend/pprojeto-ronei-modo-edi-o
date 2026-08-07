# Plan: Restore Ebook Functionality

Restore the complete e-book library functionality, integrated into the "My Courses" area without a standalone menu.

## Proposed Changes

### Database & Security
- **Migration:** Re-create `ebooks`, `ebook_modules`, `ebook_chapters`, `ebook_progress`, and `ebook_enrollments` tables.
- **RLS:** Restore policies for `admin`, `manager`, and `agent` to manage e-books, and authenticated users to read their enrollments.
- **Grants:** Apply necessary `GRANT` statements for all new tables.

### Server Logic
- **Functions:** Restore `src/lib/ebooks.functions.ts` with `createServerFn` for CRUD and progress tracking.
- **AI Integration:** Restore AI chapter/module suggestion logic if applicable.

### Admin Interface
- **Routes:** Restore `/admin/ebooks` for management (listing, creating, editing).
- **Components:** Restore ebook-specific editors (Tree structure, content editor).

### Member Interface
- **Integration:** Update `src/routes/app.cursos.index.tsx` to display a new "My E-books" section alongside courses.
- **Viewer:** Restore the single-column reader at `src/routes/app.ebooks.$ebookId.tsx`.
- **No Standalone Menu:** Ensure `Shell.tsx` navigation remains unchanged (no "E-books" link).

## Verification Plan

### Manual Verification
1. Access `/admin/ebooks` and create a test e-book.
2. Verify that the e-book appears in the "My Courses" section for the owner.
3. Open the e-book viewer and verify module/chapter navigation.
4. Check that the sidebar does NOT show an "E-books" link.

### Automated Verification
- Playwright script to:
  - Login as admin.
  - Navigate to `/admin/ebooks` (verify page loads).
  - Navigate to `/app/cursos` (verify "My E-books" section exists).
