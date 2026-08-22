ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_video_url text,
  ADD COLUMN IF NOT EXISTS packaging_video_url text;