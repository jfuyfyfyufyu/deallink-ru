
ALTER TABLE public.deals ADD COLUMN click_count INTEGER DEFAULT 0;
ALTER TABLE public.blogger_questionnaires ADD COLUMN reliability_index NUMERIC;
ALTER TABLE public.blogger_questionnaires ALTER COLUMN products_per_month TYPE TEXT USING products_per_month::TEXT;
