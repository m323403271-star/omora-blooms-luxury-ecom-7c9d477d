DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
REVOKE SELECT ON public.site_settings FROM anon;
CREATE POLICY "Admins read site settings" ON public.site_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));