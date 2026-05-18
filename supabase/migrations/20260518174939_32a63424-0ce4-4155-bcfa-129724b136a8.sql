
-- Tighten profiles SELECT: only admin or self (FINANCEIRO/DIRETORIA no longer harvest emails)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (
  deleted_at IS NULL AND (
    is_admin() OR user_id = auth.uid()
  )
);

-- Tighten servicos_funcionario: restrict reads/inserts/updates to admin/FINANCEIRO/DIRETORIA
DROP POLICY IF EXISTS servicos_funcionario_select ON public.servicos_funcionario;
CREATE POLICY servicos_funcionario_select ON public.servicos_funcionario
FOR SELECT
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role]))
);

DROP POLICY IF EXISTS servicos_funcionario_insert ON public.servicos_funcionario;
CREATE POLICY servicos_funcionario_insert ON public.servicos_funcionario
FOR INSERT
WITH CHECK (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role]))
);
