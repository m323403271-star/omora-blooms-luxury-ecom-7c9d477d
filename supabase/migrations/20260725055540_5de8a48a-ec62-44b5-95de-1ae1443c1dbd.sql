REVOKE EXECUTE ON FUNCTION public.lookup_partner(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_partner(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) TO authenticated, service_role;