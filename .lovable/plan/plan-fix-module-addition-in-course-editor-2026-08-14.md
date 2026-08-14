# Plan: Fix Module Addition in Course Editor

The user is unable to add additional modules when editing an existing course. This plan investigates and fixes the issue by ensuring the `CourseTreeEditor` component works correctly and identifying any blockers in the UI or backend logic.

## Proposed Changes

### 1. Investigation & Diagnosis
- The `CourseTreeEditor` component (used in `admin.cursos.tsx`) manages modules and lessons.
- The "Adicionar Módulo" button generates a new UUID for the module ID.
- The `handleSaveModule` function uses `supabase.from("course_modules").upsert(...)`.

### 2. Frontend Fixes
- **Component**: `src/components/admin/CourseTreeEditor.tsx`
- **Issue**: If the course is existing, we need to ensure the `course_id` is correctly passed and that the `upsert` operation doesn't conflict with existing RLS or validation rules.
- **Action**: Add explicit logging to `handleSaveModule` to capture potential errors. Verify if the `crypto.randomUUID()` is causing issues (though unlikely). Ensure the `courseId` is stable.

### 3. Backend & Security Fixes
- **RLS Check**: Verify if `course_modules` has the correct RLS policies for admins to `INSERT` and `UPDATE`.
- **Database Schema**: Check if there are any constraints (e.g., unique indices on `order_index` within a course) that might block multiple modules.
- **Migration**: Update RLS policies for `course_modules` and `course_lessons` to ensure full CRUD access for admins.

### 4. Persistence & Validation
- Ensure that after adding a module, the `fetchData` call successfully refreshes the UI.
- Verify that the `course_id` is properly linked in the `upsert` payload.

## Technical Details
- **Tables**: `public.course_modules`, `public.course_lessons`.
- **Logic**: Use `supabaseAdmin` in server functions if RLS is too restrictive, but prefer fixing RLS policies for the `authenticated` admin role.
- **Validation**: Ensure `order_index` is calculated correctly to avoid collisions if any unique constraint exists.

## Verification Plan
- **Manual Test**: Open an existing course in the admin panel, navigate to the "Conteúdo" tab, and click "Adicionar Módulo".
- **Playwright Test**: Create a script to simulate adding a module and verify it appears in the list and persists after refresh.
- **Logs**: Monitor browser console and server-side logs (if applicable) for 403 or 500 errors.
