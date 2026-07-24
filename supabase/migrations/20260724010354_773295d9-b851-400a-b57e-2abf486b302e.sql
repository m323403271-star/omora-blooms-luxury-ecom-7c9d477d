
-- ============ 1. Site settings (admin-managed defaults) ============
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  default_commission_rate numeric NOT NULL DEFAULT 10 CHECK (default_commission_rate >= 0 AND default_commission_rate <= 100),
  razorpay_enabled boolean NOT NULL DEFAULT true,
  whatsapp_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 2. Stop leaking partner contact details to the public ============
DROP POLICY IF EXISTS "Public can lookup active partners" ON public.partners;
REVOKE SELECT ON public.partners FROM anon;

-- Safe minimal-column lookup for checkout referral matching
CREATE OR REPLACE FUNCTION public.lookup_partner(_code text)
RETURNS TABLE(id uuid, code text, commission_rate numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.code, p.commission_rate
  FROM public.partners p
  WHERE p.code = upper(_code) AND p.active = true
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.lookup_partner(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_partner(text) TO anon, authenticated;

-- ============ 3. Admin read access on inquiries ============
CREATE POLICY "Admins can read inquiries" ON public.inquiries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============ 4. Server-side referred-order creation (prevents fake commissions) ============
-- Anyone-can-insert policy is dropped; only the SECURITY DEFINER function below writes rows,
-- and it recomputes total + commission from the trusted products + partners tables.
DROP POLICY IF EXISTS "Anyone can log a referred order" ON public.referred_orders;
REVOKE INSERT ON public.referred_orders FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_referred_order(_partner_code text, _items jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _partner public.partners%ROWTYPE;
  _item jsonb;
  _qty int;
  _price numeric;
  _name text;
  _total numeric := 0;
  _clean jsonb := '[]'::jsonb;
  _order_id uuid;
BEGIN
  IF _partner_code IS NULL OR length(_partner_code) = 0 THEN
    RAISE EXCEPTION 'Missing partner code';
  END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Invalid items';
  END IF;
  IF jsonb_array_length(_items) > 100 THEN
    RAISE EXCEPTION 'Too many items';
  END IF;

  SELECT * INTO _partner FROM public.partners WHERE code = upper(_partner_code) AND active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive partner code';
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := GREATEST(1, LEAST(100, COALESCE((_item->>'quantity')::int, 1)));
    SELECT price, name INTO _price, _name FROM public.products WHERE id = (_item->>'id')::uuid;
    IF _price IS NULL THEN
      RAISE EXCEPTION 'Unknown product';
    END IF;
    _total := _total + (_price * _qty);
    _clean := _clean || jsonb_build_object('id', _item->>'id', 'name', _name, 'price', _price, 'quantity', _qty);
  END LOOP;

  INSERT INTO public.referred_orders
    (partner_id, partner_code, items, total, commission_rate, commission_amount)
  VALUES
    (_partner.id, _partner.code, _clean, _total, _partner.commission_rate,
     ROUND((_total * _partner.commission_rate / 100)::numeric, 2))
  RETURNING id INTO _order_id;

  RETURN _order_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) TO anon, authenticated;
