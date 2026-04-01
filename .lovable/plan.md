

# Plan: Full User Journey Audit & Fix

## Summary of Issues Found

After tracing both the blogger and seller flows from auth to deal completion, I identified **3 categories of issues**: missing database columns, missing constraints, and a React warning.

---

## 1. Missing Columns in `deals` Table

The code references these columns that don't exist in the database, which will cause silent failures (writes ignored, reads return null):

| Column | Type | Used By |
|--------|------|---------|
| `deadline_final` | `timestamptz` | SellerApplications (approve), BloggerDeals (counter), SellerDeals |
| `status_history` | `jsonb` | DealCard (totalDays calc), SellerDeals (timeline), DealProgressBar |
| `order_screenshot_url` | `text` | BloggerDeals (order step), SellerDeals (detail view), TrackingPage |
| `payment_requested_at` | `timestamptz` | DealPaymentFlow (blogger requests advance) |
| `payment_confirmed_at` | `timestamptz` | DealPaymentFlow (blogger confirms payment) |
| `payment_screenshot_url` | `text` | DealPaymentFlow (seller uploads proof) |

**Impact**: Deal approval deadlines are lost, payment proof screenshots never saved, deal timeline/progress never tracked, order screenshots lost.

**Fix**: Single migration adding all 6 columns to `deals` table + a trigger to auto-track `status_history` on status changes.

## 2. Missing Unique Constraint on `reviews`

SellerDeals uses `upsert({ onConflict: 'deal_id,reviewer_id' })` but `reviews` has no unique constraint on `(deal_id, reviewer_id)`. This causes the upsert to fail.

**Fix**: Add `UNIQUE(deal_id, reviewer_id)` constraint to `reviews`.

## 3. Missing Columns in `blogger_questionnaires`

`use-blogger-stats.ts` references `quality_index` and `discipline_index` which don't exist in the table. These are used in the enriched blogger data for the search system, but will always be `null`.

**Fix**: Add `quality_index numeric` and `discipline_index numeric` columns to `blogger_questionnaires`.

## 4. React `forwardRef` Warning (Minor)

`AnimatedBackground` is a function component receiving a ref via lazy loading in App.tsx. This causes a console warning but is non-breaking.

**Fix**: Wrap `AnimatedBackground` with `React.forwardRef` or, simpler, since it's not lazy-loaded, no action needed — the warning comes from React's internal handling of `Suspense` boundaries and is cosmetic.

---

## Implementation Plan

### Step 1: Database Migration
Single SQL migration to:
- Add 6 missing columns to `deals` (`deadline_final`, `status_history`, `order_screenshot_url`, `payment_requested_at`, `payment_confirmed_at`, `payment_screenshot_url`)
- Initialize `status_history` as `'[]'::jsonb` default
- Create trigger `track_deal_status_history` that appends `{ "status": NEW.status, "at": now() }` to `status_history` on status change
- Add `UNIQUE(deal_id, reviewer_id)` to `reviews`
- Add `quality_index numeric` and `discipline_index numeric` to `blogger_questionnaires`

### Step 2: Update TypeScript Types
The types file auto-updates after migration, but verify the generated types include all new columns.

### Step 3: Fix `AnimatedBackground` forwardRef Warning
Wrap the component with `React.forwardRef` to suppress the warning.

### Step 4: Fix Seller Deals Filter Logic
In `SellerDeals.tsx` line 109, blogger-initiated requests are filtered out from the seller deals view (`if (d.initiated_by === 'blogger') return false`). This means sellers can only see these in the Applications page, but if a seller approves an application and it becomes a deal, it's also filtered. The filter should only exclude `status === 'requested'` deals from bloggers, not all statuses.

**Fix**: Change the filter to only exclude `requested` status with `initiated_by === 'blogger'`.

---

## Technical Details

### Migration SQL
```sql
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
    NEW.status_history = COALESCE(OLD.status_history, '[]'::jsonb) || 
      jsonb_build_object('status', NEW.status, 'at', now()::text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER deal_status_history_trigger
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.track_deal_status_change();

-- Reviews unique constraint
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_deal_reviewer_unique UNIQUE (deal_id, reviewer_id);

-- Blogger questionnaire indices
ALTER TABLE public.blogger_questionnaires
  ADD COLUMN IF NOT EXISTS quality_index numeric,
  ADD COLUMN IF NOT EXISTS discipline_index numeric;
```

### Files to Edit
- `src/components/ui/animated-background.tsx` — wrap with forwardRef
- `src/pages/seller/SellerDeals.tsx` line 109 — fix filter condition

