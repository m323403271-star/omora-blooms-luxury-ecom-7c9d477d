CREATE TABLE public.gift_card_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  whatsapp text NOT NULL,
  status text NOT NULL DEFAULT 'created',
  razorpay_order_id text UNIQUE,
  razorpay_payment_id text,
  voucher_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.gift_card_leads TO service_role;
GRANT SELECT ON public.gift_card_leads TO authenticated;
ALTER TABLE public.gift_card_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view gift card leads" ON public.gift_card_leads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));