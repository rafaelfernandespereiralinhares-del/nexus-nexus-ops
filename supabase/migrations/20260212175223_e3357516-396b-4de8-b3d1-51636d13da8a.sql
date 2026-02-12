
-- 1. Tighten logs SELECT: remove FINANCEIRO, only ADMIN + DIRETORIA can see audit logs
DROP POLICY IF EXISTS "logs_select" ON public.logs;
CREATE POLICY "logs_select" ON public.logs
  FOR SELECT TO authenticated
  USING (
    is_admin() OR (
      empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role])
    )
  );

-- 2. Revoke direct EXECUTE on security helper functions from anon and public
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_any_role(app_role[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_empresa_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_loja_id() FROM anon, public;

-- Ensure authenticated users can still use them (needed for RLS)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_empresa_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_loja_id() TO authenticated;
