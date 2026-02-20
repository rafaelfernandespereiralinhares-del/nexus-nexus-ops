
-- Fix fechamentos_select: ADMIN and FINANCEIRO should be able to see ALL rows (including soft-deleted)
-- for UPDATE purposes. Split into two permissive policies.
DROP POLICY IF EXISTS fechamentos_select ON public.fechamentos;

-- Policy 1: ADMIN and FINANCEIRO can see all rows (including deleted ones, needed for updates)
CREATE POLICY fechamentos_select_admin_financeiro
ON public.fechamentos
FOR SELECT
TO authenticated
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
);

-- Policy 2: DIRETORIA and LOJA can only see non-deleted rows of their empresa/loja
CREATE POLICY fechamentos_select_others
ON public.fechamentos
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND empresa_id = get_user_empresa_id()
  AND (
    has_any_role(ARRAY['DIRETORIA'::app_role])
    OR (
      has_any_role(ARRAY['LOJA'::app_role])
      AND loja_id = get_user_loja_id()
    )
  )
);
