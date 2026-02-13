
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "metas_semanais_select" ON public.metas_semanais;
DROP POLICY IF EXISTS "metas_semanais_insert" ON public.metas_semanais;
DROP POLICY IF EXISTS "metas_semanais_update" ON public.metas_semanais;
DROP POLICY IF EXISTS "metas_semanais_delete" ON public.metas_semanais;

CREATE POLICY "metas_semanais_select" ON public.metas_semanais
FOR SELECT USING (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND (
      has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
      OR loja_id = get_user_loja_id()
    )
  )
);

CREATE POLICY "metas_semanais_insert" ON public.metas_semanais
FOR INSERT WITH CHECK (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "metas_semanais_update" ON public.metas_semanais
FOR UPDATE USING (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
) WITH CHECK (
  is_admin() OR (
    empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
  )
);

CREATE POLICY "metas_semanais_delete" ON public.metas_semanais
FOR DELETE USING (is_admin());
