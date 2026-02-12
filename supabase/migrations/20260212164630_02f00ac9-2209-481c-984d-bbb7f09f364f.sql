
-- Fix 1: Restrict profiles SELECT to own profile or DIRETORIA/FINANCEIRO/ADMIN
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR user_id = auth.uid()
  OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
);

-- Fix 3: Replace hard DELETE with soft delete on profiles
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Add deleted_at column for soft deletes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update SELECT to exclude soft-deleted
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT TO authenticated
USING (
  deleted_at IS NULL AND (
    public.is_admin()
    OR user_id = auth.uid()
    OR (empresa_id = public.get_user_empresa_id() AND public.has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  )
);
