CREATE OR REPLACE FUNCTION public.set_payment_priority()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.pincode IN ('560030', '560300') THEN
    NEW.priority := 'airport';
  ELSIF NEW.customer_tier = 'prestige' THEN
    NEW.priority := 'prestige';
  ELSE
    NEW.priority := 'standard';
  END IF;
  RETURN NEW;
END;
$function$;