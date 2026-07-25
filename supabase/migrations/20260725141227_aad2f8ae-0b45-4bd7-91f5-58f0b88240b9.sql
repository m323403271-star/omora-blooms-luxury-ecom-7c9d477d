
INSERT INTO public.products (slug, name, tagline, description, price, compare_at_price, category, image_url, tags, featured, available, sort_order)
VALUES
  ('golden-rose-frame', 'Golden Rose Wall Frame', 'Preserved blush roses in a gilded shadow box', 'Handcrafted everlasting rose composition set inside a museum-grade gilded shadow box. A timeless statement piece for the entryway or living room.', 4999, 6499, 'frames-vases', '/src/assets/collection-frames-vases.jpg', ARRAY['new','bestseller'], true, true, 1),
  ('noir-crystal-vase', 'Noir Crystal Luxury Vase', 'Hand-blown crystal vase with everlasting pampas', 'Tall hand-blown crystal vase paired with luxe preserved pampas and gilded stems. Signature OMORA gift-boxed.', 3899, 4899, 'frames-vases', '/src/assets/collection-frames-vases.jpg', ARRAY['new'], true, true, 2),
  ('blush-eternal-frame', 'Blush Eternal Floral Frame', 'Soft pink everlasting blooms in a matte black frame', 'Delicate blush and ivory florals arranged inside a matte black gallery frame — a modern-luxury heirloom.', 4499, NULL, 'frames-vases', '/src/assets/collection-frames-vases.jpg', ARRAY['new'], false, true, 3),
  ('gilded-duo-vase-set', 'Gilded Duo Vase Set', 'Pair of luxury glass vases with signature florals', 'A curated pair of premium glass vases with preserved blush roses and golden foliage. Perfect for console or mantel styling.', 6499, 7999, 'frames-vases', '/src/assets/collection-frames-vases.jpg', ARRAY['new','giftable'], true, true, 4)
ON CONFLICT (slug) DO NOTHING;
