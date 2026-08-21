ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS product_video_url text,
  ADD COLUMN IF NOT EXISTS packaging_video_url text;

UPDATE public.product_variants
SET product_video_url = video_url
WHERE product_video_url IS NULL AND video_url IS NOT NULL;