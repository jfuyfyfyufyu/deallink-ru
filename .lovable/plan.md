

## Plan: Maximize Page Load Speed

### Root Cause Analysis

After profiling both dev and production environments, the core bottleneck is clear:

**Auth bootstrap serializes everything.** The current flow blocks ALL rendering until both `getSession()` AND `fetchProfile()` complete sequentially. On mobile/slow networks this means 2-4 seconds of blank skeleton before any content appears.

Production metrics confirm this:
- FCP: 3.4s (target: under 1.5s)
- `fetchProfile()` adds 200-800ms after session restore
- Google Fonts loaded via CSS `@import` (render-blocking)
- ProtectedRoute shows plain text "Загрузка..." instead of skeleton

### Changes

#### 1. Non-blocking auth bootstrap (AuthContext.tsx)
Decouple user detection from profile loading. Set `loading=false` immediately after `getSession()` returns, then fetch profile in background. This lets the router render instantly.

```text
Current:  getSession → fetchProfile → setLoading(false) → render  (2-4s)
New:      getSession → setLoading(false) → render  (0.5-1s)
                     → fetchProfile in background → setProfile when ready
```

Remove the complex `getStoredRefreshToken` helper — Supabase client already handles token persistence with `persistSession: true` and `autoRefreshToken: true`. The manual refresh logic adds latency and race conditions.

#### 2. Fix ProtectedRoute loading state
Replace `"Загрузка..."` text with `PageSkeleton` component for consistent visual feedback.

#### 3. Move Google Fonts out of CSS @import
The `@import url(fonts.googleapis.com...)` in `index.css` is render-blocking. Move to `<link>` tags in `index.html` (already has `preconnect` and `preload` hints but the actual stylesheet load is still in CSS). Add `font-display: swap`.

#### 4. Preload critical JS chunks in index.html
Add `<link rel="modulepreload">` for vendor and index chunks so the browser starts fetching them during HTML parse.

### Files to Modify

| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Non-blocking profile fetch, remove manual token logic, simplify bootstrap |
| `src/components/ProtectedRoute.tsx` | Use PageSkeleton instead of text |
| `src/index.css` | Remove `@import` for Google Fonts |
| `index.html` | Add font stylesheet `<link>`, add modulepreload hints |

### Expected Results

- FCP drops from 3.4s to ~1.2-1.5s (profile fetch no longer blocks render)
- Auth-gated pages render skeleton → content instead of blank → skeleton → content
- Font loading no longer blocks first paint
- No behavior changes — profile still loads, just doesn't block UI

