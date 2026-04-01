
-- Mark all old unused codes as used to clean up before adding constraint
UPDATE telegram_auth_codes SET used = true WHERE used = false AND created_at < now() - interval '10 minutes';

-- Add partial unique index: only one active (unused) code per (chat_id, role)
CREATE UNIQUE INDEX idx_telegram_auth_codes_active
ON telegram_auth_codes (telegram_chat_id, role)
WHERE used = false;
