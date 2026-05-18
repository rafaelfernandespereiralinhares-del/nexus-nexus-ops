DROP POLICY IF EXISTS funcionarios_select ON public.funcionarios;
CREATE POLICY funcionarios_select ON public.funcionarios
FOR SELECT
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (
    empresa_id = get_user_empresa_id()
    AND (
      has_any_role(ARRAY['DIRETORIA'::app_role])
      OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())
    )
  )
);