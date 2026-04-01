
CREATE OR REPLACE FUNCTION public.notify_seller_deal_status_changed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_url text;
  v_key text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1);
    v_key := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY' LIMIT 1);
    
    -- Skip notification if secrets are not configured, don't block the deal update
    IF v_url IS NOT NULL AND v_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := v_url || '/functions/v1/telegram-deal-status',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_key
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
  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate trigger to ensure it's attached
DROP TRIGGER IF EXISTS trg_notify_seller_deal_status_changed ON public.deals;
CREATE TRIGGER trg_notify_seller_deal_status_changed
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_deal_status_changed();
