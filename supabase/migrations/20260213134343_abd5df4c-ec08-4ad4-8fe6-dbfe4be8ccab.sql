
-- =============================================
-- FUNCIONÁRIOS (Employees)
-- =============================================
CREATE TYPE public.vinculo_tipo AS ENUM ('CLT', 'MEI', 'PJ', 'ESTAGIARIO');

CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL DEFAULT '',
  vinculo public.vinculo_tipo NOT NULL DEFAULT 'CLT',
  salario NUMERIC NOT NULL DEFAULT 0,
  passagem NUMERIC NOT NULL DEFAULT 0,
  ajuda_custo NUMERIC NOT NULL DEFAULT 0,
  admissao DATE NOT NULL DEFAULT CURRENT_DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funcionarios_select" ON public.funcionarios FOR SELECT
  USING (is_admin() OR (empresa_id = get_user_empresa_id()));

CREATE POLICY "funcionarios_insert" ON public.funcionarios FOR INSERT
  WITH CHECK (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])));

CREATE POLICY "funcionarios_update" ON public.funcionarios FOR UPDATE
  USING (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])))
  WITH CHECK (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])));

CREATE POLICY "funcionarios_delete" ON public.funcionarios FOR DELETE
  USING (is_admin());

CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- SERVIÇOS DOS FUNCIONÁRIOS (Employee Services / Commissions)
-- =============================================
CREATE TABLE public.servicos_funcionario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL DEFAULT '',
  valor NUMERIC NOT NULL DEFAULT 0,
  comissao NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos_funcionario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "servicos_funcionario_select" ON public.servicos_funcionario FOR SELECT
  USING (is_admin() OR (empresa_id = get_user_empresa_id()));

CREATE POLICY "servicos_funcionario_insert" ON public.servicos_funcionario FOR INSERT
  WITH CHECK (is_admin() OR (empresa_id = get_user_empresa_id()));

CREATE POLICY "servicos_funcionario_update" ON public.servicos_funcionario FOR UPDATE
  USING (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])))
  WITH CHECK (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])));

CREATE POLICY "servicos_funcionario_delete" ON public.servicos_funcionario FOR DELETE
  USING (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])));

-- =============================================
-- CAMPANHAS DE VENDAS (Sales Campaigns)
-- =============================================
CREATE TYPE public.campanha_tipo AS ENUM ('DIARIA', 'SEMANAL', 'MENSAL');

CREATE TABLE public.campanhas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  produto_servico TEXT NOT NULL DEFAULT '',
  tipo public.campanha_tipo NOT NULL DEFAULT 'MENSAL',
  meta_quantidade INTEGER NOT NULL DEFAULT 0,
  progresso INTEGER NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE NOT NULL DEFAULT CURRENT_DATE,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campanhas_select" ON public.campanhas FOR SELECT
  USING (is_admin() OR (empresa_id = get_user_empresa_id()));

CREATE POLICY "campanhas_insert" ON public.campanhas FOR INSERT
  WITH CHECK (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])));

CREATE POLICY "campanhas_update" ON public.campanhas FOR UPDATE
  USING (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])))
  WITH CHECK (is_admin() OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])));

CREATE POLICY "campanhas_delete" ON public.campanhas FOR DELETE
  USING (is_admin());

CREATE TRIGGER update_campanhas_updated_at BEFORE UPDATE ON public.campanhas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- ADD meta_lucro to metas table
-- =============================================
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS meta_lucro NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS realizado_faturamento NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS realizado_lucro NUMERIC NOT NULL DEFAULT 0;
