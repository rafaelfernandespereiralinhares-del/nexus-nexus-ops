
-- Tabela para armazenar DRE histórico (dados de anos anteriores, incluindo empresas que não existem mais)
CREATE TABLE public.dre_historico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id),
  loja_nome text NOT NULL, -- texto livre pois lojas antigas podem não existir mais
  loja_id uuid REFERENCES public.lojas(id), -- nullable, pode ser null para lojas que não existem mais
  ano integer NOT NULL,
  mes integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  categoria text NOT NULL, -- ex: RECEITAS, DEDUCOES, CMV, DESPESAS_FIXAS, DESPESAS_VARIAVEIS, DESPESAS_VENDAS, RESULTADO
  subcategoria text NOT NULL, -- ex: RECEITA_ACESSORIOS, ALUGUEL, SALARIOS_EQUIPE_MANTIQUEIRA
  valor numeric NOT NULL DEFAULT 0,
  percentual numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, loja_nome, ano, mes, categoria, subcategoria)
);

-- Enable RLS
ALTER TABLE public.dre_historico ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "dre_historico_select" ON public.dre_historico
FOR SELECT USING (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND 
    has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "dre_historico_insert" ON public.dre_historico
FOR INSERT WITH CHECK (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND 
    has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "dre_historico_update" ON public.dre_historico
FOR UPDATE USING (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND 
    has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
) WITH CHECK (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND 
    has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "dre_historico_delete" ON public.dre_historico
FOR DELETE USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_dre_historico_updated_at
BEFORE UPDATE ON public.dre_historico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Index for fast lookups
CREATE INDEX idx_dre_historico_empresa_ano ON public.dre_historico(empresa_id, ano, mes);
CREATE INDEX idx_dre_historico_loja ON public.dre_historico(loja_nome, ano);
