-- has_role is referenced inside RLS policies, which evaluate as the calling role.
-- It must remain executable by authenticated users or all admin access breaks.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;