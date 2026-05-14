
CREATE TABLE public.saidas_diarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  loja_id UUID NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'OUTROS',
  valor NUMERIC NOT NULL DEFAULT 0,
  observacao TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saidas_diarias_loja_data ON public.saidas_diarias(loja_id, data);

ALTER TABLE public.saidas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY saidas_diarias_select ON public.saidas_diarias FOR SELECT
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND (
    has_any_role(ARRAY['DIRETORIA'::app_role])
    OR loja_id = get_user_loja_id()
  ))
);

CREATE POLICY saidas_diarias_insert ON public.saidas_diarias FOR INSERT
WITH CHECK (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND (
    has_any_role(ARRAY['DIRETORIA'::app_role])
    OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())
  ))
);

CREATE POLICY saidas_diarias_update ON public.saidas_diarias FOR UPDATE
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND (
    has_any_role(ARRAY['DIRETORIA'::app_role])
    OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())
  ))
)
WITH CHECK (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND (
    has_any_role(ARRAY['DIRETORIA'::app_role])
    OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())
  ))
);

CREATE POLICY saidas_diarias_delete ON public.saidas_diarias FOR DELETE
USING (
  is_admin()
  OR has_any_role(ARRAY['FINANCEIRO'::app_role])
  OR (empresa_id = get_user_empresa_id() AND (
    has_any_role(ARRAY['DIRETORIA'::app_role])
    OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())
  ))
);

CREATE TRIGGER trg_saidas_diarias_updated
BEFORE UPDATE ON public.saidas_diarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
