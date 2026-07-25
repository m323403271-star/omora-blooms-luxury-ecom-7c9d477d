REVOKE ALL ON FUNCTION public.log_referred_order(text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_referred_order(text, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.log_referred_order(text, jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) TO service_role;