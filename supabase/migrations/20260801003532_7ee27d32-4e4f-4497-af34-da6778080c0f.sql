
-- 1) Private order-previews bucket: admin-only access
DROP POLICY IF EXISTS "Admins read order previews" ON storage.objects;
DROP POLICY IF EXISTS "Admins write order previews" ON storage.objects;
DROP POLICY IF EXISTS "Admins update order previews" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete order previews" ON storage.objects;

CREATE POLICY "Admins read order previews" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'order-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins write order previews" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'order-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update order previews" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'order-previews' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'order-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete order previews" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'order-previews' AND public.has_role(auth.uid(), 'admin'));

-- 2) Reviews: users cannot self-award verified buyer badge
DROP POLICY IF EXISTS "Users insert own review" ON public.reviews;
DROP POLICY IF EXISTS "Users update own review" ON public.reviews;

CREATE POLICY "Users insert own review" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND verified_buyer = false);

CREATE POLICY "Users update own review" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND verified_buyer = false);

-- 3) Referral orders: server-only
REVOKE ALL ON FUNCTION public.log_referred_order(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_referred_order(text, jsonb) TO service_role;
