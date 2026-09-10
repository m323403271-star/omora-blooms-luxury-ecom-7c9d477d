CREATE TABLE IF NOT EXISTS public.concierge_call_log (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  ip text,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS concierge_call_log_phone_time ON public.concierge_call_log (phone, created_at desc);
CREATE INDEX IF NOT EXISTS concierge_call_log_ip_time ON public.concierge_call_log (ip, created_at desc);
GRANT ALL ON public.concierge_call_log TO service_role;
ALTER TABLE public.concierge_call_log ENABLE ROW LEVEL SECURITY;