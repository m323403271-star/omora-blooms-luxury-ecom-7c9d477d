GRANT SELECT ON public.partners TO anon;
CREATE POLICY "Public can lookup active partners" ON public.partners FOR SELECT TO anon USING (active = true);