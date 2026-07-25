ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS customer_tier TEXT NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS pickup_point_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'standard';

CREATE OR REPLACE FUNCTION public.set_payment_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.pincode = '560300' OR NEW.pincode = '562110' THEN
    NEW.priority := 'airport';
  ELSIF NEW.customer_tier = 'prestige' THEN
    NEW.priority := 'prestige';
  ELSE
    NEW.priority := 'standard';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_payment_priority ON public.payments;
CREATE TRIGGER trg_set_payment_priority
  BEFORE INSERT OR UPDATE OF pincode, customer_tier ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_priority();

CREATE INDEX IF NOT EXISTS idx_payments_priority_created
  ON public.payments (priority, created_at DESC);