CREATE OR REPLACE FUNCTION public.prevent_undelete_fechamentos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent setting deleted_at back to NULL if it was set (only Admin/Financeiro/Diretoria can restore)
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    IF NOT is_admin() AND NOT has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role]) THEN
      RAISE EXCEPTION 'Não é permitido restaurar fechamentos excluídos';
    END IF;
  END IF;

  -- Setting deleted_at: Admin/Financeiro/Diretoria sempre podem; LOJA só se for da própria loja e estiver ABERTO
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    IF NOT is_admin()
       AND NOT has_any_role(ARRAY['DIRETORIA'::app_role, 'FINANCEIRO'::app_role])
       AND NOT (
         has_any_role(ARRAY['LOJA'::app_role])
         AND OLD.loja_id = get_user_loja_id()
         AND OLD.status = 'ABERTO'::fechamento_status
       )
    THEN
      RAISE EXCEPTION 'Não é permitido excluir fechamentos';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;