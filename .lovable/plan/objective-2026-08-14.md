
### Objective
Fix recipe deletion behavior to ensure it's permanent, immediate, and consistent across all views.

### Proposed Changes

#### 1. Database Security (RLS)
- Update RLS policies for the `recipes` table to explicitly allow `DELETE` and `UPDATE` for authenticated users (admins). Currently, only `SELECT` is explicitly granted in the policy list despite the `authenticated` role being used.
- Add `GRANT DELETE ON public.recipes TO authenticated;` to ensure the Data API allows the operation.

#### 2. Admin Interface Improvements
- Optimize the `handleDelete` function in `src/routes/admin.receitas.tsx` to optimisticly update the UI state before the background refresh, preventing the "flicker" where the item reappears momentarily.
- Ensure the `fetchData` call correctly handles the post-deletion state.

#### 3. Student View Consistency
- Verify that the student view in `src/routes/app.receitas.tsx` correctly filters out any recipes that might have been soft-deleted (though the request specifies permanent deletion, we will ensure the `SELECT` query is robust).

### Technical Details

#### SQL Migration
```sql
-- Ensure RLS is enabled
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies if necessary and add comprehensive ones
DROP POLICY IF EXISTS "Recipes are viewable by authenticated users" ON public.recipes;

CREATE POLICY "Recipes are viewable by all authenticated users" 
ON public.recipes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage recipes" 
ON public.recipes FOR ALL TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

-- Explicitly grant permissions to the authenticated role
GRANT ALL ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
```

#### Frontend Refactor (`src/routes/admin.receitas.tsx`)
```typescript
async function handleDelete(id: string) {
  if (!confirm("Tem certeza que deseja excluir esta receita?")) return;
  
  // Optimistic update
  const originalRecipes = [...recipes];
  setRecipes(recipes.filter(r => r.id !== id));
  
  try {
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw error;
    toast.success("Receita excluída permanentemente");
  } catch (error: any) {
    // Rollback on error
    setRecipes(originalRecipes);
    toast.error("Erro ao excluir: " + error.message);
  }
}
```
