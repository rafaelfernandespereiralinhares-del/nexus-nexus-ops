
-- Fix profiles UPDATE policy to block soft-deleted records
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (
    deleted_at IS NULL AND ((user_id = auth.uid()) OR is_admin())
  ) WITH CHECK (
    deleted_at IS NULL AND ((user_id = auth.uid()) OR is_admin())
  );

-- Fix fechamentos UPDATE policy to block soft-deleted records
DROP POLICY IF EXISTS "fechamentos_update" ON public.fechamentos;
CREATE POLICY "fechamentos_update" ON public.fechamentos
  FOR UPDATE USING (
    deleted_at IS NULL AND (
      is_admin() OR (
        empresa_id = get_user_empresa_id() AND (
          has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
          OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id() AND status = 'ABERTO')
        )
      )
    )
  ) WITH CHECK (
    deleted_at IS NULL AND (
      is_admin() OR (
        empresa_id = get_user_empresa_id() AND (
          has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
          OR (has_any_role(ARRAY['LOJA'::app_role]) AND loja_id = get_user_loja_id() AND status = 'ABERTO')
        )
      )
    )
  );
