
-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  media JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{url,type:'image'|'video'}]
  verified_buyer BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX reviews_product_idx ON public.reviews(product_id, created_at DESC);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are public" ON public.reviews
  FOR SELECT USING (approved = true);
CREATE POLICY "Users insert own review" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own review" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all reviews" ON public.reviews
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for review-media (private bucket, signed URLs from server)
CREATE POLICY "Auth upload review media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner read review media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner delete review media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'review-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins manage review media" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'review-media' AND public.has_role(auth.uid(), 'admin'));

-- Preview photo on payments (bouquet preview before dispatch)
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS preview_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS preview_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS preview_channel TEXT; -- 'whatsapp' | 'email'

-- Storage policies for product-images (used for admin preview photos too, if not already)
-- (skipped: already set in prior migration)
