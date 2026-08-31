CREATE TABLE public.tryon_usage (
  user_id uuid PRIMARY KEY,
  trial_count integer NOT NULL DEFAULT 0 CHECK (trial_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tryon_usage TO authenticated;
GRANT ALL ON public.tryon_usage TO service_role;

ALTER TABLE public.tryon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own try-on usage"
ON public.tryon_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER trg_tryon_usage_updated_at
BEFORE UPDATE ON public.tryon_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.consume_tryon_trial()
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _count integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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

REVOKE ALL ON FUNCTION public.consume_tryon_trial() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_tryon_trial() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_tryon_trial() TO service_role;