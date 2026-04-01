-- Add missing deal columns
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS deadline_final timestamptz,
  ADD COLUMN IF NOT EXISTS status_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS order_screenshot_url text,
  ADD COLUMN IF NOT EXISTS payment_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_screenshot_url text;

-- Status history tracking trigger
CREATE OR REPLACE FUNCTION public.track_deal_status_change()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public' AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_history = COALESCE(OLD.status_history, '[]'::jsonb)
      || jsonb_build_object('status', NEW.status, 'at', now()::text);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deal_status_history_trigger ON public.deals;
CREATE TRIGGER deal_status_history_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.track_deal_status_change();

-- Reviews unique constraint for upsert
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_deal_reviewer_unique UNIQUE (deal_id, reviewer_id);

-- Blogger questionnaire indices
ALTER TABLE public.blogger_questionnaires
  ADD COLUMN IF NOT EXISTS quality_index numeric,
  ADD COLUMN IF NOT EXISTS discipline_index numeric;