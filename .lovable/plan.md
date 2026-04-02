

## Complete Migration Instructions for New Lovable Environment

### Problem
The previous `SETUP_INSTRUCTIONS.md` file was never actually created in the codebase. I need to create a comprehensive, self-contained instruction file that covers **every** component needed to replicate the current working system.

### What the current system consists of

After auditing all 10 migrations, edge functions, cron jobs, secrets, storage, and triggers, here is the complete inventory:

**Database:**
- 1 enum: `app_role`
- 11 tables: `profiles`, `user_roles`, `products`, `deals`, `deal_messages`, `deal_archives`, `blogger_questionnaires`, `reviews`, `notifications`, `telegram_bot_state`, `telegram_auth_codes`, `telegram_messages`
- 5 functions: `has_role`, `update_updated_at_column`, `handle_new_user`, `track_deal_status_change`, `notify_seller_deal_status_changed`
- 6 triggers: 4x `update_updated_at`, `deal_status_history_trigger`, `trg_notify_seller_deal_status_changed`, `on_auth_user_created`
- 1 constraint: `reviews_deal_reviewer_unique`
- 4 indexes on telegram tables
- 1 partial unique index: `idx_telegram_auth_codes_active`
- Full RLS policies on all tables
- Realtime enabled for `deals`, `deal_messages`, `notifications`

**Storage:** 2 public buckets (`proofs`, `product-images`) with RLS policies

**Edge Functions (4):** `telegram-poll`, `telegram-auth`, `telegram-notify`, `telegram-deal-status`

**Cron:** `pg_cron` job polling `telegram-poll` every minute

**Secrets (2 manual):** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (in vault for trigger), `LOVABLE_API_KEY` (auto), `TELEGRAM_API_KEY` (connector)

**Auth config:** JWT expiry 30 days, trigger on `auth.users` for auto-profile creation

**Hardcoded references to update:**
- `deallink-ru.lovable.app` in `telegram-deal-status/index.ts`
- `BlogerTop_bot` in `AuthPage.tsx`
- Cron job URL contains project ref + anon key

### Plan: Create `SETUP_INSTRUCTIONS.md`

Create a single file with a complete prompt that the user can paste into the new Lovable project chat. The prompt will contain:

1. **Single consolidated SQL migration** — all 10 migrations merged into one idempotent script covering:
   - Enum, all 11 tables with all columns (including ones added in later migrations)
   - All RLS policies
   - All functions and triggers
   - Storage buckets and their policies
   - Realtime publication
   - Indexes and constraints

2. **Vault secrets setup** — SQL to insert `SUPABASE_URL` and `SUPABASE_ANON_KEY` into vault (needed by the `notify_seller_deal_status_changed` trigger)

3. **pg_cron setup** — SQL with placeholders for new project ref and anon key

4. **Telegram connector** — instruction to connect Telegram via connector tool

5. **Auth config** — `supabase/config.toml` JWT expiry setting

6. **Edge functions** — note that they deploy automatically from the ZIP

7. **Checklist of things to update** — domain URL in `telegram-deal-status`, bot username if changed

### Files to create
- `SETUP_INSTRUCTIONS.md` — the complete migration guide

### Important gaps the previous plan was missing
- **pg_cron job** was not mentioned at all
- **Vault secrets** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) used by the trigger function were not documented
- **Partial unique index** on `telegram_auth_codes` was missing
- **`notify_seller_deal_status_changed` trigger** and its dependency on `pg_net` extension was not explicitly documented
- **`deal_archives` table** unique constraint `(deal_id, user_id)` was not mentioned
- **`reviews` unique constraint** `reviews_deal_reviewer_unique` was missing
- Several columns added in later migrations (e.g. `deadline_final`, `status_history`, `order_screenshot_url`, `payment_*`, `attachment_url` on `deal_messages`, `deal_id` on `notifications`, `quality_index`, `discipline_index`) were not consolidated
- **Hardcoded URL** `deallink-ru.lovable.app` in edge function needs updating
- **Auth trigger** `on_auth_user_created` on `auth.users` — critical for auto-profile creation

