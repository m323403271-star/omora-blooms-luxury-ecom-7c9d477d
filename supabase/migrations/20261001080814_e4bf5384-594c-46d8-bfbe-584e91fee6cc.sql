DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Admins read product images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Site images are publicly readable" ON public.site_images;
CREATE POLICY "Storefront site images are readable" ON public.site_images FOR SELECT TO anon, authenticated
  USING (page_type IN ('homepage', 'subcategory'));

CREATE OR REPLACE FUNCTION public.set_payment_priority()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.pincode IN ('560030', '560300') THEN
    NEW.priority := 'airport';
  ELSE
    NEW.priority := 'standard';
  END IF;
  RETURN NEW;
END;
$function$;