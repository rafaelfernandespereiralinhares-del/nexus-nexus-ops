
-- 1. Fix dre_historico_select to enforce empresa isolation
DROP POLICY IF EXISTS dre_historico_select ON public.dre_historico;
CREATE POLICY dre_historico_select ON public.dre_historico
  FOR SELECT
  USING (
    is_admin()
    OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['FINANCEIRO'::app_role, 'DIRETORIA'::app_role]))
  );

-- 2. Prevent users from changing empresa_id / loja_id on their own profile
CREATE OR REPLACE FUNCTION public.prevent_profile_tenant_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    IF NEW.empresa_id IS DISTINCT FROM OLD.empresa_id THEN
      RAISE EXCEPTION 'Não é permitido alterar empresa_id do próprio perfil';
    END IF;
    IF NEW.loja_id IS DISTINCT FROM OLD.loja_id THEN
      RAISE EXCEPTION 'Não é permitido alterar loja_id do próprio perfil';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Não é permitido alterar user_id do próprio perfil';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_tenant_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_tenant_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_tenant_change();

-- 3. Restrict funcionarios SELECT: LOJA users can no longer read compensation
-- Approach: drop LOJA from base policy; create a view-equivalent restricted policy is complex,
-- so instead remove LOJA access entirely (compensation is sensitive). LOJA continues to see
-- own profile and other data; for employee listings LOJA users will need another mechanism.
DROP POLICY IF EXISTS funcionarios_select ON public.funcionarios;
CREATE POLICY funcionarios_select ON public.funcionarios
  FOR SELECT
  USING (
    is_admin()
    OR has_any_role(ARRAY['FINANCEIRO'::app_role])
    OR (empresa_id = get_user_empresa_id() AND has_any_role(ARRAY['DIRETORIA'::app_role]))
  );
