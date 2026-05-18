
-- Revoke execute from PUBLIC and anon for security definer helper functions
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.is_admin()',
    'public.has_role(uuid, app_role)',
    'public.has_any_role(app_role[])',
    'public.get_user_empresa_id()',
    'public.get_user_loja_id()',
    'public.prevent_undelete_fechamentos()',
    'public.prevent_profile_tenant_change()',
    'public.handle_new_user()'
  ]
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn);
  END LOOP;
END $$;
