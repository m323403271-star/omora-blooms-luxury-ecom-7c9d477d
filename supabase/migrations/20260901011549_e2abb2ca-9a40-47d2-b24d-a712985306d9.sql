CREATE TABLE public.app_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Deliberately NO grants to anon/authenticated: this table must never be
-- reachable from the Data API. Only service_role (backend) may touch it.
GRANT ALL ON public.app_secrets TO service_role;

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_secrets_no_client_access"
ON public.app_secrets
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE TRIGGER trg_app_secrets_updated_at
BEFORE UPDATE ON public.app_secrets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_app_secret(_name text, _value text, _actor uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _name IS NULL OR length(trim(_name)) = 0 THEN
    RAISE EXCEPTION 'Secret name required';
  END IF;
  IF _value IS NULL OR length(trim(_value)) = 0 THEN
    RAISE EXCEPTION 'Secret value required';
  END IF;

  INSERT INTO public.app_secrets (name, value, updated_by)
  VALUES (trim(_name), trim(_value), _actor)
  ON CONFLICT (name)
  DO UPDATE SET value = trim(_value), updated_by = _actor, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_app_secret(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_app_secret(text, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.set_app_secret(text, text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_app_secret(text, text, uuid) TO service_role;