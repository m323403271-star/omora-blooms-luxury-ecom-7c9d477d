
DROP POLICY "Anyone can submit an inquiry" ON public.inquiries;
CREATE POLICY "Anyone can submit a valid inquiry" ON public.inquiries FOR INSERT
WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 100
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND length(email) <= 255
  AND length(message) BETWEEN 1 AND 5000
);
