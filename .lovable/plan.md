

## Plan: Fix Build Error + Maximize Page Load Speed

### Problem Analysis

1. **Build error**: Likely caused by the `LandingPage.tsx` edits — `CountUpValue` and `ScrollReveal` are function components receiving refs via `useRef` internally but the console warns about refs being passed to them. Need to check for TypeScript issues.

2. **Slow page load after auth**: The `Index` page eagerly imports `LandingPage` (a 349-line component with animations), which means the entire landing page code is bundled with the main chunk even for authenticated users who never see it. The auth bootstrap also blocks rendering for up to 6 seconds.

3. **Loading indicator**: Index still shows "Загрузка..." text instead of skeleton.

### Changes

#### 1. Fix Build Error — LandingPage TypeScript
- Verify the exact build error (likely related to recent LandingPage edits)
- Ensure `CountUpValue` and `ScrollReveal` don't cause TS errors

#### 2. Lazy-load LandingPage in Index.tsx
- Move `LandingPage` import to `lazy(() => import('./LandingPage'))` inside `Index.tsx`
- This removes the heavy landing page from the main bundle for authenticated users
- Replace "Загрузка..." text with `PageSkeleton`

#### 3. Optimize Auth Bootstrap Speed
- Reduce safety timeout from 6000ms to 4000ms
- Skip the `refreshSession()` call during bootstrap if `getSession()` already returned a valid session (currently it always calls both)
- Remove `setLoading(true)` from `onAuthStateChange` to avoid flashing loading state on token refresh

#### 4. Optimize QueryClient defaults
- Set `staleTime` to 60 seconds on QueryClient so dashboard data doesn't refetch on every mount
- Set `gcTime` (cacheTime) to 5 minutes

#### 5. Add prefetch hints
- Add `<link rel="modulepreload">` for critical vendor chunks in `index.html` if applicable

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Index.tsx` | Lazy-load LandingPage, use PageSkeleton |
| `src/contexts/AuthContext.tsx` | Optimize bootstrap: reduce timeout, skip redundant refresh, no loading flash on token refresh |
| `src/App.tsx` | Add staleTime/gcTime to QueryClient defaults |
| `src/pages/LandingPage.tsx` | Fix any TS build error (verify first) |

### Technical Details

```text
Current flow (slow):
  App mount → AuthProvider.loading=true → 
  getSession() → refreshSession() → fetchProfile() → loading=false →
  Index renders → imports LandingPage (bundled) OR navigates

Optimized flow:
  App mount → AuthProvider.loading=true →
  getSession() → (skip refresh if session exists) → fetchProfile() → loading=false →
  Index renders → lazy-loads LandingPage OR navigates (dashboard already lazy)
```

The key wins:
- **LandingPage lazy**: removes ~15KB+ from initial bundle for auth'd users
- **Skip redundant refresh**: saves 200-500ms on bootstrap for users with valid sessions
- **QueryClient staleTime**: prevents re-fetching dashboard data on every navigation
- **No loading flash on token refresh**: eliminates mid-session skeleton flashes

