CREATE TABLE public.user_occasions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text NOT NULL DEFAULT '',
  occasion_date date NOT NULL,
  flower_preference text,
  last_reminded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_occasions TO authenticated;
GRANT ALL ON public.user_occasions TO service_role;

ALTER TABLE public.user_occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own occasions" ON public.user_occasions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view occasions" ON public.user_occasions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_user_occasions_user ON public.user_occasions(user_id);
CREATE INDEX idx_user_occasions_date ON public.user_occasions(occasion_date);

CREATE TRIGGER trg_user_occasions_updated_at
  BEFORE UPDATE ON public.user_occasions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.loyalty_points (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own points" ON public.loyalty_points
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "loyalty_points_no_client_writes" ON public.loyalty_points
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.sync_loyalty_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  INSERT INTO public.loyalty_points (user_id, points_balance)
  VALUES (_uid, (SELECT COALESCE(SUM(delta), 0)::int FROM public.loyalty_ledger WHERE user_id = _uid))
  ON CONFLICT (user_id) DO UPDATE
    SET points_balance = EXCLUDED.points_balance, updated_at = now();
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_loyalty_ledger_sync_points
  AFTER INSERT OR UPDATE OR DELETE ON public.loyalty_ledger
  FOR EACH ROW EXECUTE FUNCTION public.sync_loyalty_points();

INSERT INTO public.loyalty_points (user_id, points_balance)
SELECT user_id, COALESCE(SUM(delta), 0)::int FROM public.loyalty_ledger GROUP BY user_id
ON CONFLICT (user_id) DO UPDATE SET points_balance = EXCLUDED.points_balance;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'occasion-reminders-daily',
  '30 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--9b70daa9-6a74-48da-91ba-28f391def9de.lovable.app/api/public/occasion-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-key', COALESCE((SELECT value FROM public.app_secrets WHERE name = 'cron_key'), '')
    ),
    body := '{}'::jsonb
  );
  $$
);