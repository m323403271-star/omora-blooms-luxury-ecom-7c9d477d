ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_mode text NOT NULL DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_total numeric,
  ADD COLUMN IF NOT EXISTS balance_due numeric NOT NULL DEFAULT 0;