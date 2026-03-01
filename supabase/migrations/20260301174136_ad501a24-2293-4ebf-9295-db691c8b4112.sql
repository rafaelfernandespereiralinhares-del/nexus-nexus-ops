
-- Tabela de configuração de metas por vendedor (ligado a funcionários)
CREATE TABLE public.metas_vendedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id),
  mes TEXT NOT NULL, -- formato "2026-03"
  escala TEXT NOT NULL DEFAULT 'comercial', -- '12x36_0900_2100', '6x1_seg_sab_1340_2200', '6x1_folga_quarta_trabalha_dom_1340_2200', 'comercial'
  unidade_de_trabalho TEXT NOT NULL DEFAULT 'dia_trabalhado', -- 'plantao' ou 'dia_trabalhado'
  qtd_unidades_reais_mes INTEGER NOT NULL DEFAULT 26,
  horas_liquidas_mes NUMERIC NOT NULL DEFAULT 0,
  meta_mensal NUMERIC NOT NULL DEFAULT 0,
  meta_semanal_s1 NUMERIC NOT NULL DEFAULT 0,
  meta_semanal_s2 NUMERIC NOT NULL DEFAULT 0,
  meta_semanal_s3 NUMERIC NOT NULL DEFAULT 0,
  meta_semanal_s4 NUMERIC NOT NULL DEFAULT 0,
  meta_por_unidade NUMERIC NOT NULL DEFAULT 0,
  -- Faixas de premiação diária (valores de venda mínima)
  faixa_premio_30 NUMERIC NOT NULL DEFAULT 0,
  faixa_premio_50 NUMERIC NOT NULL DEFAULT 0,
  faixa_premio_80 NUMERIC NOT NULL DEFAULT 0,
  faixa_premio_120 NUMERIC NOT NULL DEFAULT 0,
  -- Elegibilidade
  min_semanal_s1 NUMERIC NOT NULL DEFAULT 0,
  min_semanal_s2 NUMERIC NOT NULL DEFAULT 0,
  min_semanal_s3 NUMERIC NOT NULL DEFAULT 0,
  min_semanal_s4 NUMERIC NOT NULL DEFAULT 0,
  min_mensal NUMERIC NOT NULL DEFAULT 0,
  -- Realizado (atualizado conforme vendas)
  realizado_mensal NUMERIC NOT NULL DEFAULT 0,
  realizado_semanal_s1 NUMERIC NOT NULL DEFAULT 0,
  realizado_semanal_s2 NUMERIC NOT NULL DEFAULT 0,
  realizado_semanal_s3 NUMERIC NOT NULL DEFAULT 0,
  realizado_semanal_s4 NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, loja_id, funcionario_id, mes)
);

-- Tabela de configuração de premiação por empresa/mês
CREATE TABLE public.premiacao_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  mes TEXT NOT NULL, -- formato "2026-03"
  -- Premiação diária (faixas com multiplicador sobre meta_dia)
  premio_diario_faixa1_mult NUMERIC NOT NULL DEFAULT 1.0,
  premio_diario_faixa1_valor NUMERIC NOT NULL DEFAULT 30,
  premio_diario_faixa2_mult NUMERIC NOT NULL DEFAULT 1.2,
  premio_diario_faixa2_valor NUMERIC NOT NULL DEFAULT 50,
  premio_diario_faixa3_mult NUMERIC NOT NULL DEFAULT 1.5,
  premio_diario_faixa3_valor NUMERIC NOT NULL DEFAULT 80,
  premio_diario_faixa4_mult NUMERIC NOT NULL DEFAULT 2.0,
  premio_diario_faixa4_valor NUMERIC NOT NULL DEFAULT 120,
  -- Premiação semanal
  premio_semanal_valor NUMERIC NOT NULL DEFAULT 100,
  premio_semanal_min_participacao NUMERIC NOT NULL DEFAULT 0.7,
  -- Premiação mensal vendedor
  premio_mensal_vendedor_valor NUMERIC NOT NULL DEFAULT 100,
  premio_mensal_vendedor_min_participacao NUMERIC NOT NULL DEFAULT 1.0,
  -- Premiação mensal loja
  premio_mensal_loja_valor NUMERIC NOT NULL DEFAULT 150,
  premio_mensal_loja_min_participacao NUMERIC NOT NULL DEFAULT 0.7,
  -- Parâmetros gerais
  multiplicador_meta_final NUMERIC NOT NULL DEFAULT 1.2,
  pesos_semana_json JSONB NOT NULL DEFAULT '[0.35, 0.25, 0.2, 0.2]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, mes)
);

-- Enable RLS
ALTER TABLE public.metas_vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premiacao_config ENABLE ROW LEVEL SECURITY;

-- RLS for metas_vendedores
CREATE POLICY "metas_vendedores_select" ON public.metas_vendedores FOR SELECT
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

CREATE POLICY "metas_vendedores_insert" ON public.metas_vendedores FOR INSERT
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "metas_vendedores_update" ON public.metas_vendedores FOR UPDATE
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "metas_vendedores_delete" ON public.metas_vendedores FOR DELETE
  USING (is_admin());

-- RLS for premiacao_config
CREATE POLICY "premiacao_config_select" ON public.premiacao_config FOR SELECT
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'LOJA'::app_role])));

CREATE POLICY "premiacao_config_insert" ON public.premiacao_config FOR INSERT
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "premiacao_config_update" ON public.premiacao_config FOR UPDATE
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "premiacao_config_delete" ON public.premiacao_config FOR DELETE
  USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_metas_vendedores_updated_at
  BEFORE UPDATE ON public.metas_vendedores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_premiacao_config_updated_at
  BEFORE UPDATE ON public.premiacao_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
