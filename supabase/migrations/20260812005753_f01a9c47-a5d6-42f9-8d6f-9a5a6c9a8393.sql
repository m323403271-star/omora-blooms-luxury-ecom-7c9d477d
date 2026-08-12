CREATE TABLE public.loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX loyalty_ledger_user_idx ON public.loyalty_ledger (user_id);
CREATE UNIQUE INDEX loyalty_ledger_earn_once_idx ON public.loyalty_ledger (payment_id) WHERE payment_id IS NOT NULL AND delta > 0;

GRANT SELECT ON public.loyalty_ledger TO authenticated;
GRANT ALL ON public.loyalty_ledger TO service_role;

ALTER TABLE public.loyalty_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "loyalty_select_own" ON public.loyalty_ledger
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "loyalty_ledger_no_client_writes" ON public.loyalty_ledger
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.reward_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  discount_inr numeric(10,2) NOT NULL CHECK (discount_inr > 0),
  status text NOT NULL DEFAULT 'active',
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '180 days')
);
CREATE INDEX reward_codes_user_idx ON public.reward_codes (user_id);

GRANT SELECT ON public.reward_codes TO authenticated;
GRANT ALL ON public.reward_codes TO service_role;

ALTER TABLE public.reward_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reward_codes_select_own" ON public.reward_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "reward_codes_no_client_writes" ON public.reward_codes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.loyalty_balance()
RETURNS integer LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT COALESCE(SUM(delta), 0)::int FROM public.loyalty_ledger WHERE user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.loyalty_balance() TO authenticated;