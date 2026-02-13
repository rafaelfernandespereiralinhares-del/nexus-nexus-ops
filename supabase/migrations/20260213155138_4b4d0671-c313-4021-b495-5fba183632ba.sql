
-- Give FINANCEIRO cross-company access to key tables
-- This is needed because all companies belong to the same group owner

-- fechamentos: allow FINANCEIRO to SELECT, INSERT, UPDATE across all companies
DROP POLICY IF EXISTS fechamentos_select ON public.fechamentos;
CREATE POLICY "fechamentos_select" ON public.fechamentos FOR SELECT
USING (
  deleted_at IS NULL AND (
    is_admin()
    OR has_any_role(ARRAY['FINANCEIRO'::app_role])
    OR (empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role])
      OR loja_id = get_user_loja_id()
    ))
  )
);

DROP POLICY IF EXISTS fechamentos_insert ON public.fechamentos;
CREATE POLICY "fechamentos_insert" ON public.fechamentos FOR INSERT
WITH CHECK (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'LOJA'::app_role]))
);

DROP POLICY IF EXISTS fechamentos_update ON public.fechamentos;
CREATE POLICY "fechamentos_update" ON public.fechamentos FOR UPDATE
USING (
  deleted_at IS NULL AND (
    is_admin()
    OR has_any_role(ARRAY['FINANCEIRO'::app_role])
    OR (empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role])
      OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id() AND status = 'ABERTO')
    ))
  )
)
WITH CHECK (
  deleted_at IS NULL AND (
    is_admin()
    OR has_any_role(ARRAY['FINANCEIRO'::app_role])
    OR (empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role])
      OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id() AND status = 'ABERTO')
    ))
  )
);

-- metas: FINANCEIRO cross-company
DROP POLICY IF EXISTS metas_select ON public.metas;
CREATE POLICY "metas_select" ON public.metas FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

DROP POLICY IF EXISTS metas_insert ON public.metas;
CREATE POLICY "metas_insert" ON public.metas FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS metas_update ON public.metas;
CREATE POLICY "metas_update" ON public.metas FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- metas_semanais: FINANCEIRO cross-company
DROP POLICY IF EXISTS metas_semanais_select ON public.metas_semanais;
CREATE POLICY "metas_semanais_select" ON public.metas_semanais FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

DROP POLICY IF EXISTS metas_semanais_insert ON public.metas_semanais;
CREATE POLICY "metas_semanais_insert" ON public.metas_semanais FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS metas_semanais_update ON public.metas_semanais;
CREATE POLICY "metas_semanais_update" ON public.metas_semanais FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- funcionarios: FINANCEIRO cross-company
DROP POLICY IF EXISTS funcionarios_select ON public.funcionarios;
CREATE POLICY "funcionarios_select" ON public.funcionarios FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS funcionarios_insert ON public.funcionarios;
CREATE POLICY "funcionarios_insert" ON public.funcionarios FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS funcionarios_update ON public.funcionarios;
CREATE POLICY "funcionarios_update" ON public.funcionarios FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- lojas: FINANCEIRO can see all
DROP POLICY IF EXISTS lojas_select ON public.lojas;
CREATE POLICY "lojas_select" ON public.lojas FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR id = get_user_loja_id())));

-- empresas: FINANCEIRO can see all
DROP POLICY IF EXISTS empresas_select ON public.empresas;
CREATE POLICY "empresas_select" ON public.empresas FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR id = get_user_empresa_id());

-- contas_pagar: FINANCEIRO cross-company
DROP POLICY IF EXISTS contas_pagar_select ON public.contas_pagar;
CREATE POLICY "contas_pagar_select" ON public.contas_pagar FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

DROP POLICY IF EXISTS contas_pagar_insert ON public.contas_pagar;
CREATE POLICY "contas_pagar_insert" ON public.contas_pagar FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS contas_pagar_update ON public.contas_pagar;
CREATE POLICY "contas_pagar_update" ON public.contas_pagar FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- contas_receber: FINANCEIRO cross-company
DROP POLICY IF EXISTS contas_receber_select ON public.contas_receber;
CREATE POLICY "contas_receber_select" ON public.contas_receber FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

DROP POLICY IF EXISTS contas_receber_insert ON public.contas_receber;
CREATE POLICY "contas_receber_insert" ON public.contas_receber FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS contas_receber_update ON public.contas_receber;
CREATE POLICY "contas_receber_update" ON public.contas_receber FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- conciliacoes: FINANCEIRO cross-company
DROP POLICY IF EXISTS conciliacoes_select ON public.conciliacoes;
CREATE POLICY "conciliacoes_select" ON public.conciliacoes FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

DROP POLICY IF EXISTS conciliacoes_insert ON public.conciliacoes;
CREATE POLICY "conciliacoes_insert" ON public.conciliacoes FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS conciliacoes_update ON public.conciliacoes;
CREATE POLICY "conciliacoes_update" ON public.conciliacoes FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- auditorias: FINANCEIRO cross-company
DROP POLICY IF EXISTS auditorias_select ON public.auditorias;
CREATE POLICY "auditorias_select" ON public.auditorias FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

DROP POLICY IF EXISTS auditorias_insert ON public.auditorias;
CREATE POLICY "auditorias_insert" ON public.auditorias FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS auditorias_update ON public.auditorias;
CREATE POLICY "auditorias_update" ON public.auditorias FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- campanhas: FINANCEIRO cross-company
DROP POLICY IF EXISTS campanhas_select ON public.campanhas;
CREATE POLICY "campanhas_select" ON public.campanhas FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS campanhas_insert ON public.campanhas;
CREATE POLICY "campanhas_insert" ON public.campanhas FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS campanhas_update ON public.campanhas;
CREATE POLICY "campanhas_update" ON public.campanhas FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- servicos_funcionario: FINANCEIRO cross-company
DROP POLICY IF EXISTS servicos_funcionario_select ON public.servicos_funcionario;
CREATE POLICY "servicos_funcionario_select" ON public.servicos_funcionario FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS servicos_funcionario_insert ON public.servicos_funcionario;
CREATE POLICY "servicos_funcionario_insert" ON public.servicos_funcionario FOR INSERT
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR empresa_id = get_user_empresa_id());

DROP POLICY IF EXISTS servicos_funcionario_update ON public.servicos_funcionario;
CREATE POLICY "servicos_funcionario_update" ON public.servicos_funcionario FOR UPDATE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

DROP POLICY IF EXISTS servicos_funcionario_delete ON public.servicos_funcionario;
CREATE POLICY "servicos_funcionario_delete" ON public.servicos_funcionario FOR DELETE
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

-- dre_historico: FINANCEIRO cross-company
DROP POLICY IF EXISTS dre_historico_select ON public.dre_historico;
CREATE POLICY "dre_historico_select" ON public.dre_historico FOR SELECT
USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role, 'DIRETORIA'::app_role]));

-- profiles: FINANCEIRO can see all profiles (cross-company)
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
USING (
  deleted_at IS NULL AND (
    is_admin()
    OR user_id = auth.uid()
    OR has_any_role(ARRAY['FINANCEIRO'::app_role])
    OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role]))
  )
);
