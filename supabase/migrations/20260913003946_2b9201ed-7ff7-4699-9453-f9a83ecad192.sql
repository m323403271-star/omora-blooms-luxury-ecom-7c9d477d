CREATE TABLE public.native_push_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL DEFAULT 'android' CHECK (platform IN ('android')),
  role_label text NOT NULL CHECK (role_label IN ('admin', 'agent')),
  active boolean NOT NULL DEFAULT true,
  device_name text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.native_push_devices TO authenticated;
GRANT ALL ON public.native_push_devices TO service_role;

ALTER TABLE public.native_push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage own native devices"
ON public.native_push_devices
FOR ALL
TO authenticated
USING (
  auth.uid() = user_id
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'agent')
  )
);

CREATE INDEX native_push_devices_active_idx
ON public.native_push_devices (active, last_seen_at DESC);

CREATE TRIGGER trg_native_push_devices_updated_at
BEFORE UPDATE ON public.native_push_devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();