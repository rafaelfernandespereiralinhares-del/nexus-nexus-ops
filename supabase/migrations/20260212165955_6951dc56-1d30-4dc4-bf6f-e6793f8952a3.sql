
-- ============================================
-- 1. DENY DELETE on all financial/operational tables
-- ============================================

-- fechamentos: deny all hard deletes (soft delete only)
CREATE POLICY "fechamentos_deny_delete" ON public.fechamentos
  FOR DELETE USING (false);

-- conciliacoes: deny all hard deletes
CREATE POLICY "conciliacoes_deny_delete" ON public.conciliacoes
  FOR DELETE USING (false);

-- contas_pagar: deny all hard deletes
CREATE POLICY "contas_pagar_deny_delete" ON public.contas_pagar
  FOR DELETE USING (false);

-- contas_receber: deny all hard deletes
CREATE POLICY "contas_receber_deny_delete" ON public.contas_receber
  FOR DELETE USING (false);

-- auditorias: deny all hard deletes
CREATE POLICY "auditorias_deny_delete" ON public.auditorias
  FOR DELETE USING (false);

-- metas: deny all hard deletes
CREATE POLICY "metas_deny_delete" ON public.metas
  FOR DELETE USING (false);

-- relatorios_ia: deny all hard deletes
CREATE POLICY "relatorios_ia_deny_delete" ON public.relatorios_ia
  FOR DELETE USING (false);

-- profiles: deny all hard deletes (soft delete only)
CREATE POLICY "profiles_deny_delete" ON public.profiles
  FOR DELETE USING (false);

-- logs: deny DELETE and UPDATE (append-only, immutable)
CREATE POLICY "logs_deny_delete" ON public.logs
  FOR DELETE USING (false);

CREATE POLICY "logs_deny_update" ON public.logs
  FOR UPDATE USING (false);

-- ============================================
-- 2. ADD WITH CHECK to all UPDATE policies missing it
-- ============================================

-- Drop and recreate policies with WITH CHECK

-- planos
DROP POLICY IF EXISTS "planos_update" ON public.planos;
CREATE POLICY "planos_update" ON public.planos
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- empresas
DROP POLICY IF EXISTS "empresas_update" ON public.empresas;
CREATE POLICY "empresas_update" ON public.empresas
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- lojas
DROP POLICY IF EXISTS "lojas_update" ON public.lojas;
CREATE POLICY "lojas_update" ON public.lojas
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- user_roles
DROP POLICY IF EXISTS "user_roles_update" ON public.user_roles;
CREATE POLICY "user_roles_update" ON public.user_roles
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- fechamentos
DROP POLICY IF EXISTS "fechamentos_update" ON public.fechamentos;
CREATE POLICY "fechamentos_update" ON public.fechamentos
  FOR UPDATE USING (
    is_admin() OR (
      empresa_id = get_user_empresa_id() AND (
        has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
        OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id() AND status = 'ABERTO')
      )
    )
  ) WITH CHECK (
    is_admin() OR (
      empresa_id = get_user_empresa_id() AND (
        has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
        OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id() AND status = 'ABERTO')
      )
    )
  );

-- metas
DROP POLICY IF EXISTS "metas_update" ON public.metas;
CREATE POLICY "metas_update" ON public.metas
  FOR UPDATE USING (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  ) WITH CHECK (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  );

-- conciliacoes
DROP POLICY IF EXISTS "conciliacoes_update" ON public.conciliacoes;
CREATE POLICY "conciliacoes_update" ON public.conciliacoes
  FOR UPDATE USING (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  ) WITH CHECK (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  );

-- contas_pagar
DROP POLICY IF EXISTS "contas_pagar_update" ON public.contas_pagar;
CREATE POLICY "contas_pagar_update" ON public.contas_pagar
  FOR UPDATE USING (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  ) WITH CHECK (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  );

-- contas_receber
DROP POLICY IF EXISTS "contas_receber_update" ON public.contas_receber;
CREATE POLICY "contas_receber_update" ON public.contas_receber
  FOR UPDATE USING (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  ) WITH CHECK (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  );

-- auditorias
DROP POLICY IF EXISTS "auditorias_update" ON public.auditorias;
CREATE POLICY "auditorias_update" ON public.auditorias
  FOR UPDATE USING (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  ) WITH CHECK (
    is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]))
  );
