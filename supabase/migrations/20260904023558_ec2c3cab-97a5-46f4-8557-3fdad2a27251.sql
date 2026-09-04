ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'agent';

CREATE TABLE IF NOT EXISTS public.order_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id text,
  payment_id uuid,
  customer_name text,
  customer_phone text,
  pincode text,
  amount numeric,
  priority text,
  items_summary text,
  channels jsonb NOT NULL DEFAULT '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.order_alerts TO authenticated;
GRANT ALL ON public.order_alerts TO service_role;
ALTER TABLE public.order_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS order_alerts_created_idx ON public.order_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS order_alerts_pending_idx ON public.order_alerts (acknowledged_at) WHERE acknowledged_at IS NULL;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  role_label text NOT NULL DEFAULT 'admin',
  user_agent text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage own devices" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.order_alerts;
