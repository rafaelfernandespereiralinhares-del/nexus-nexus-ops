
-- Drop and recreate the fechamentos UPDATE policy to properly allow soft-delete for ADMIN and FINANCEIRO
DROP POLICY IF EXISTS fechamentos_update ON public.fechamentos;

CREATE POLICY fechamentos_update
ON public.fechamentos
FOR UPDATE
TO authenticated
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (
    empresa_id = get_user_empresa_id()
    AND (
      has_any_role(ARRAY['DIRETORIA'::app_role])
      OR (
        has_any_role(ARRAY['LOJA'::app_role])
        AND loja_id = get_user_loja_id()
        AND status = 'ABERTO'::fechamento_status
        AND deleted_at IS NULL
      )
    )
  )
)
WITH CHECK (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (
    empresa_id = get_user_empresa_id()
    AND (
      has_any_role(ARRAY['DIRETORIA'::app_role])
      OR (
        has_any_role(ARRAY['LOJA'::app_role])
        AND loja_id = get_user_loja_id()
        AND status = 'ABERTO'::fechamento_status
      )
    )
  )
);
