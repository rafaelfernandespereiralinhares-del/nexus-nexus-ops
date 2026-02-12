
-- Fix 1: Prevent soft-delete bypass on fechamentos (restrict deleted_at modification to ADMIN/DIRETORIA/FINANCEIRO)
CREATE OR REPLACE FUNCTION public.prevent_undelete_fechamentos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent setting deleted_at back to NULL if it was set
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    IF NOT is_admin() AND NOT has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]) THEN
      RAISE EXCEPTION 'Não é permitido restaurar fechamentos excluídos';
    END IF;
  END IF;
  -- Prevent LOJA users from setting deleted_at
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    IF NOT is_admin() AND NOT has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]) THEN
      RAISE EXCEPTION 'Não é permitido excluir fechamentos';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_undelete_fechamentos
  BEFORE UPDATE ON public.fechamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_undelete_fechamentos();

-- Fix 2: Add DELETE policy to profiles for admins
CREATE POLICY "profiles_delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin());
