# Authentication Diagnostic Instructions

## How to Use the AuthDiagnostic Component

1. **Add the component to your Dashboard** temporarily:

   In `src/pages/Dashboard.tsx`, add this import at the top:
   ```javascript
   import AuthDiagnostic from '@/components/diagnostics/AuthDiagnostic';
   ```

   Then add the component to the render return (around line 200):
   ```jsx
   return (
     <UnsavedChangesProvider>
       <div className="relative min-h-screen md:flex">
         <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
         
         <main className="flex-1 md:ml-64 pt-16">
           <div className="pb-4 md:pb-8 px-[17px] pt-0">
             {/* Add this diagnostic component temporarily */}
             <AuthDiagnostic />
             
             <div className="mb-8">
               <div className="flex items-center justify-between">
                 {/* ... rest of existing code ... */}
   ```

2. **Check the Browser Console**:
   - Open Developer Tools (F12)
   - Go to the Console tab
   - Look for the log messages from the diagnostic component

3. **What to Look For**:

   **Good Result** (authentication working):
   ```
   Session data: { session: { user: { id: "...", email: "..." } } }
   User data: { user: { id: "...", email: "..." } }
   Profile data: { id: "...", full_name: "...", role: "..." }
   ```

   **Bad Result** (authentication not working):
   ```
   Session data: { session: null }
   User data: { user: null }
   Profile error: "Missing session or session has expired"
   ```

4. **Common Issues and Fixes**:

   **Issue 1: No session/user data**
   - User is not properly logged in
   - Session cookies are not being set
   - Supabase client configuration is wrong

   **Issue 2: Session exists but no profile**
   - RLS policies are still blocking access
   - Profile doesn't exist for this user
   - User ID mismatch between auth and profiles

5. **After Testing**:
   - Remove the AuthDiagnostic component from Dashboard.tsx
   - Clear browser cache and cookies
   - Test normal application functionality

6. **If Authentication is Working**:
   We can then restore the proper RLS policies and fix any remaining issues.

7. **If Authentication is NOT Working**:
   We need to check:
   - Supabase client configuration in `src/integrations/supabase/client.ts`
   - Login/Signup implementation
   - Session management
   - CORS/cookie settings in Supabase dashboard