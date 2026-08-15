CREATE POLICY "Public read review media" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'review-media');
