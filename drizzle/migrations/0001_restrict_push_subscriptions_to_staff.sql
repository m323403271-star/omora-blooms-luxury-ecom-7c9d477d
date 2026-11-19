DROP POLICY IF EXISTS "Staff manage own devices" ON public.push_subscriptions;
CREATE POLICY "Staff manage own devices" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'agent'::public.app_role)
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'agent'::public.app_role)
    )
  );