
-- Allow ADMIN to delete metas
DROP POLICY IF EXISTS metas_deny_delete ON public.metas;
CREATE POLICY "metas_delete" ON public.metas FOR DELETE USING (is_admin());
