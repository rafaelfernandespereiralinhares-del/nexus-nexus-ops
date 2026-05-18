
CREATE TABLE public.vales_funcionarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL,
  loja_id uuid NOT NULL,
  funcionario_id uuid,
  funcionario_nome text NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  valor numeric NOT NULL DEFAULT 0,
  descricao text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vales_loja_data ON public.vales_funcionarios(loja_id, data);

ALTER TABLE public.vales_funcionarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY vales_select ON public.vales_funcionarios FOR SELECT USING (
  is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR loja_id = get_user_loja_id()))
);

CREATE POLICY vales_insert ON public.vales_funcionarios FOR INSERT WITH CHECK (
  is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())))
);

CREATE POLICY vales_update ON public.vales_funcionarios FOR UPDATE USING (
  is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())))
) WITH CHECK (
  is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())))
);

CREATE POLICY vales_delete ON public.vales_funcionarios FOR DELETE USING (
  is_admin() OR has_any_role(ARRAY['FINANCEIRO'::app_role]) OR
  (empresa_id = get_user_empresa_id() AND (has_any_role(ARRAY['DIRETORIA'::app_role]) OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id())))
);

CREATE TRIGGER trg_vales_updated BEFORE UPDATE ON public.vales_funcionarios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
