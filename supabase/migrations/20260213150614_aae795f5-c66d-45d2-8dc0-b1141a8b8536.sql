
-- Tabela de metas semanais por loja
CREATE TABLE public.metas_semanais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id),
  loja_id UUID NOT NULL REFERENCES public.lojas(id),
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  qtd_colaboradores INTEGER NOT NULL DEFAULT 0,
  folha_semanal NUMERIC NOT NULL DEFAULT 0,
  contas_pagar_semana NUMERIC NOT NULL DEFAULT 0,
  custo_total_semana NUMERIC NOT NULL DEFAULT 0,
  meta_faturamento_semana NUMERIC NOT NULL DEFAULT 0,
  realizado_semana NUMERIC NOT NULL DEFAULT 0,
  margem_seguranca NUMERIC NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metas_semanais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metas_semanais_select" ON public.metas_semanais AS RESTRICTIVE
FOR SELECT USING (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
      OR loja_id = get_user_loja_id()
    )
  )
);

CREATE POLICY "metas_semanais_insert" ON public.metas_semanais AS RESTRICTIVE
FOR INSERT WITH CHECK (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "metas_semanais_update" ON public.metas_semanais AS RESTRICTIVE
FOR UPDATE USING (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
) WITH CHECK (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "metas_semanais_delete" ON public.metas_semanais AS RESTRICTIVE
FOR DELETE USING (is_admin());

CREATE TRIGGER update_metas_semanais_updated_at
BEFORE UPDATE ON public.metas_semanais
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
