ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS products_is_trending_idx ON public.products (is_trending) WHERE is_trending;
CREATE INDEX IF NOT EXISTS products_is_bestseller_idx ON public.products (is_bestseller) WHERE is_bestseller;
CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products (created_at DESC);