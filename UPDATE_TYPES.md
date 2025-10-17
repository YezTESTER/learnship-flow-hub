# Update Supabase Types

After creating new database functions, you need to regenerate the Supabase types:

1. Run the following command in your project directory:
   ```bash
   npx supabase gen types typescript --project-id "your-project-id" --schema public > src/integrations/supabase/types.ts
   ```

2. Or if you're using the Supabase CLI:
   ```bash
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

This will update the types.ts file to include the new `bulk_assign_learners_to_mentor` function, which should resolve the TypeScript error in SystemSettings.tsx.