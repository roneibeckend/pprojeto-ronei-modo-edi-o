# Plan: Fix Course Schema 'modules' Error

This plan addresses the error `Could not find the 'modules' column of 'courses' in the schema cache` that occurs during course management operations.

## Problem
The application code is attempting to save a property named `modules` to the `courses` table in Supabase. However, `modules` is a virtual/relational property (derived from the `course_modules` table) and does not exist as a column in the `courses` table itself. This mismatch causes a schema error in the Supabase client/PostgREST.

## Proposed Changes

### Frontend Fixes

#### 1. Update `src/routes/admin.cursos.tsx`
- Refactor `handleSubmit` to strip the `modules` property from the `editingItem` object before calling `supabase.upsert`.
- Ensure other operations (like duplication) also handle this property correctly.

#### 2. Verify `src/components/admin/CourseTreeEditor.tsx`
- Confirm that the tree editor saves directly to `course_modules` and `course_lessons` instead of trying to update the parent `courses` table with a nested structure. (Inspection shows it already does this correctly).

## Technical Details

### Code Modification
In `src/routes/admin.cursos.tsx`, the `handleSubmit` function will be modified:

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  try {
    setIsSaving(true);
    // Remove virtual 'modules' property before saving to 'courses' table
    const { modules, ...payload } = editingItem;
    
    const { data, error } = await supabase
      .from('courses')
      .upsert({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    // ... rest of the logic
  }
}
```

This pattern follows the fix already implemented for e-books in the project.

## Verification Plan

1. **Build Check**: Run `npm run build:dev` to ensure no regressions.
2. **Manual Test**: 
   - Open the Admin Panel (`/admin/cursos`).
   - Create a new course and save.
   - Edit an existing course and save.
   - Duplicate a course.
3. **Database Check**: Confirm changes are persisted in the `courses` table without errors.
