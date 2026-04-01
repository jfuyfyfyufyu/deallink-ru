
CREATE OR REPLACE FUNCTION public.notify_seller_deal_status_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1) || '/functions/v1/telegram-deal-status',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1)
      ),
      body := jsonb_build_object(
        'deal_id', NEW.id,
        'seller_id', NEW.seller_id,
        'blogger_id', NEW.blogger_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_seller_deal_status_changed ON public.deals;
CREATE TRIGGER trg_notify_seller_deal_status_changed
  AFTER UPDATE OF status ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_deal_status_changed();
