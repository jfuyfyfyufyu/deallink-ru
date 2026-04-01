
ALTER TABLE public.deals ADD COLUMN tracking_token TEXT UNIQUE;
ALTER TABLE public.deals ADD COLUMN views_count INTEGER DEFAULT 0;
ALTER TABLE public.deals ADD COLUMN is_overdue BOOLEAN DEFAULT false;
ALTER TABLE public.deals ADD COLUMN utm_url TEXT;

ALTER TABLE public.blogger_questionnaires ADD COLUMN completion_probability NUMERIC;
ALTER TABLE public.blogger_questionnaires ADD COLUMN speed_index NUMERIC;
