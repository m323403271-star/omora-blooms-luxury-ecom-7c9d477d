CREATE OR REPLACE FUNCTION public.handle_new_user_roles()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF lower(NEW.email) IN ('m323403271@gmail.com', 'omorablooms5@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  UPDATE public.partners
     SET user_id = NEW.id
   WHERE user_id IS NULL
     AND contact_email IS NOT NULL
     AND lower(contact_email) = lower(NEW.email);

  IF EXISTS (SELECT 1 FROM public.partners WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'partner')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created_roles ON auth.users;
CREATE TRIGGER on_auth_user_created_roles
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_roles();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) = 'm323403271@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;