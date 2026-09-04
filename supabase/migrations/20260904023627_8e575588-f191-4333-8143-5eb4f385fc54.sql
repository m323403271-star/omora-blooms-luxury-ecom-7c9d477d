CREATE POLICY "Staff view order alerts" ON public.order_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Staff acknowledge order alerts" ON public.order_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'agent'));

CREATE POLICY "Agents view orders" ON public.payments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'agent'));
