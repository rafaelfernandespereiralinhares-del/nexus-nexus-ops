DROP TRIGGER IF EXISTS prevent_profile_tenant_change_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_tenant_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_tenant_change();