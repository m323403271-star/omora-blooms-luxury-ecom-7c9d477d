-- 1. Coupons: no longer publicly readable (validation happens server-side)
DROP POLICY IF EXISTS "Active coupons are readable" ON public.coupons;
REVOKE ALL ON public.coupons FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

-- 2. Abandoned carts: explicit deny for all client writes (server role only)
DROP POLICY IF EXISTS "abandoned_carts_no_client_writes" ON public.abandoned_carts;
CREATE POLICY "abandoned_carts_no_client_writes"
  ON public.abandoned_carts
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (false);
REVOKE ALL ON public.abandoned_carts FROM anon;
GRANT ALL ON public.abandoned_carts TO service_role;

-- 3. Restrict SECURITY DEFINER functions from direct client execution
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
REVOKE ALL ON FUNCTION public.log_referred_order(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.lookup_partner(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_partner(text) TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user_roles() FROM PUBLIC, anon, authenticated;

-- has_role is referenced inside RLS policies, which evaluate as the calling role.
-- It must remain executable by authenticated users or all admin access breaks.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;