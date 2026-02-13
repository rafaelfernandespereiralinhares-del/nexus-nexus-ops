
-- Enum for payment types on the card machine
CREATE TYPE public.tipo_pagamento_maquina AS ENUM (
  'DEBITO', 'CREDITO', 'PIX',
  'CREDITO_2X', 'CREDITO_3X', 'CREDITO_4X', 'CREDITO_5X',
  'CREDITO_6X', 'CREDITO_7X', 'CREDITO_8X', 'CREDITO_9X', 'CREDITO_10X'
);

-- Table: Máquina Amarela (card machine transactions)
CREATE TABLE public.maquina_amarela (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL DEFAULT '',
  tipo_pagamento public.tipo_pagamento_maquina NOT NULL,
  valor_bruto NUMERIC NOT NULL DEFAULT 0,
  taxa_percentual NUMERIC NOT NULL DEFAULT 0,
  valor_taxa NUMERIC NOT NULL DEFAULT 0,
  valor_liquido NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maquina_amarela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maquina_amarela_select" ON public.maquina_amarela FOR SELECT
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id())));

CREATE POLICY "maquina_amarela_insert" ON public.maquina_amarela FOR INSERT
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id()))));

CREATE POLICY "maquina_amarela_update" ON public.maquina_amarela FOR UPDATE
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "maquina_amarela_delete" ON public.maquina_amarela FOR DELETE
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE TRIGGER update_maquina_amarela_updated_at
  BEFORE UPDATE ON public.maquina_amarela
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Table: Custos Casa / Retirada (personal expenses)
CREATE TYPE public.custo_casa_status AS ENUM ('ABERTO', 'PAGO');

CREATE TABLE public.custos_casa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  categoria TEXT NOT NULL DEFAULT 'RETIRADA',
  status public.custo_casa_status NOT NULL DEFAULT 'ABERTO',
  data_pagamento DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custos_casa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custos_casa_select" ON public.custos_casa FOR SELECT
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "custos_casa_insert" ON public.custos_casa FOR INSERT
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "custos_casa_update" ON public.custos_casa FOR UPDATE
  USING (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])))
  WITH CHECK (is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR 
    (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])));

CREATE POLICY "custos_casa_delete" ON public.custos_casa FOR DELETE
  USING (is_admin());

CREATE TRIGGER update_custos_casa_updated_at
  BEFORE UPDATE ON public.custos_casa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
