
-- Drop the overly permissive planos_select policy
DROP POLICY IF EXISTS "planos_select" ON public.planos;

-- Recreate with authentication requirement
CREATE POLICY "planos_select" ON public.planos
FOR SELECT TO authenticated
USING (true);
