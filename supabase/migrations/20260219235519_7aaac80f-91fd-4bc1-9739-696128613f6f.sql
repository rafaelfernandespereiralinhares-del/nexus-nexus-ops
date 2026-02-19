-- Fix the fechamentos UPDATE policy to allow soft-delete (setting deleted_at)
-- The current policy blocks setting deleted_at because it checks deleted_at IS NULL
DROP POLICY IF EXISTS fechamentos_update ON public.fechamentos;

CREATE POLICY fechamentos_update ON public.fechamentos
FOR UPDATE
USING (
  is_admin() OR
  has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (
    empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role]) OR
      (
        has_any_role(ARRAY['LOJA'::app_role]) AND
        loja_id = get_user_loja_id() AND
        status = 'ABERTO'::fechamento_status AND
        deleted_at IS NULL
      )
    )
  )
)
WITH CHECK (
  is_admin() OR
  has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (
    empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role]) OR
      (
        has_any_role(ARRAY['LOJA'::app_role]) AND
        loja_id = get_user_loja_id() AND
        status = 'ABERTO'::fechamento_status AND
        deleted_at IS NULL
      )
    )
  )
);