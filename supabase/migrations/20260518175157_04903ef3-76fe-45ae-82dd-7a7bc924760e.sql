
-- Trigger-only functions: revoke execute from everyone (triggers run as table owner)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_undelete_fechamentos() FROM PUBLIC, anon, authenticated;

-- RBAC helpers: needed inside RLS policies, so authenticated must keep EXECUTE.
-- Revoke from PUBLIC and anon to silence the linter and prevent unauthenticated probing.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(public.app_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_empresa_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_loja_id() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_empresa_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_loja_id() TO authenticated;
