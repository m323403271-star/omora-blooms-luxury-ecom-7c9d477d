REVOKE EXECUTE ON FUNCTION public.consume_tryon_trial() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_tryon_trial() FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_tryon_trial() FROM PUBLIC;
DROP FUNCTION public.consume_tryon_trial();

CREATE OR REPLACE FUNCTION public.consume_tryon_trial(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User ID required';
  END IF;

  INSERT INTO public.tryon_usage (user_id, trial_count)
  VALUES (_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET trial_count = public.tryon_usage.trial_count + 1,
                updated_at = now()
  RETURNING trial_count INTO _count;

  RETURN _count;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_tryon_trial(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_tryon_trial(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.consume_tryon_trial(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_tryon_trial(uuid) TO service_role;