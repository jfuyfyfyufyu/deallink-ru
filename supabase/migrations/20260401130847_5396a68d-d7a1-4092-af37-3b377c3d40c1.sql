
ALTER TABLE public.deal_messages
  ADD COLUMN IF NOT EXISTS attachment_url text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS deal_id uuid;

DROP TRIGGER IF EXISTS deal_status_history_trigger ON public.deals;
CREATE TRIGGER deal_status_history_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.track_deal_status_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_deal_reviewer_unique'
  ) THEN
    ALTER TABLE public.reviews ADD CONSTRAINT reviews_deal_reviewer_unique UNIQUE (deal_id, reviewer_id);
  END IF;
END $$;
