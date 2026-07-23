
-- Auto-assign admin role for the brand owner email, and auto-link partner rows by contact_email
CREATE OR REPLACE FUNCTION public.handle_new_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin auto-grant for brand owner
  IF lower(NEW.email) = 'omorablooms5@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Link partner row if one exists with a matching contact_email and no user yet
  UPDATE public.partners
     SET user_id = NEW.id
   WHERE user_id IS NULL
     AND contact_email IS NOT NULL
     AND lower(contact_email) = lower(NEW.email);

  -- Grant partner role if this user is now linked to a partner
  IF EXISTS (SELECT 1 FROM public.partners WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'partner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_roles ON auth.users;
CREATE TRIGGER on_auth_user_created_roles
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_roles();

-- Backfill for any users already created (in case some exist)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
  FROM auth.users u
 WHERE lower(u.email) = 'omorablooms5@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.partners p
   SET user_id = u.id
  FROM auth.users u
 WHERE p.user_id IS NULL
   AND p.contact_email IS NOT NULL
   AND lower(p.contact_email) = lower(u.email);

INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'partner'::app_role
  FROM public.partners p
 WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
