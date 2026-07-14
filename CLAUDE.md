# Workie — Architecture Notes for Claude

## Stack
- **Next.js 16 App Router** (TypeScript, `force-dynamic` on data pages)
- **Supabase** (PostgREST + Auth + Storage + RLS)
- **Vercel** (deployment, geo headers via `x-vercel-ip-country-region` / `x-vercel-ip-city`)

## Critical: PostgREST returns numbers as strings

Supabase PostgREST serialises `NUMERIC` and `INTEGER` columns as **JSON strings**, not numbers.
The TypeScript types in `src/lib/types.ts` declare them as `number` but at runtime they arrive as `string`.

**Rule**: always wrap with `Number()` before any arithmetic, comparison (`> 0`), or rendering:
```ts
// WRONG — "0" + "4.2" = "04.2"
subset.reduce((s, r) => s + r.rating, 0)

// CORRECT
subset.reduce((s, r) => s + Number(r.rating), 0)
Number(company.avg_rating) > 0   // not company.avg_rating > 0
Number(company.avg_salary_chf) > 0  // "0" is truthy in JS
```

Affects: `avg_rating`, `review_count`, `score`, `avg_salary_chf`, `salary_chf`, all `rating_*` fields, `helpful_count`.

## Z-index hierarchy

| Layer | z-index |
|---|---|
| Bottom nav | 10001 |
| Modals above nav | ≥ 10002 |
| Filter panel | 10050 |
| Search modal | 10100 |

All `position: fixed` modals must be ≥ 10002 or they are hidden behind the bottom nav on mobile.

## Mobile CSS rules

- Use `overflow-x: clip` (not `overflow-x: hidden`) on all scroll-containing ancestors. `hidden` creates a new scroll container that traps `position: fixed` children. `clip` does not.
- All `<input>`, `<select>`, `<textarea>` must have `font-size: 16px` on mobile (≤768px) to prevent iOS/Android auto-zoom on focus. A global rule in `globals.css` handles this; don't override with smaller inline values.
- The bottom nav hides when a keyboard-triggering element is focused, via `body:has(input:focus, ...) .bottom-nav { display: none }`.
- Minimum touch target: 48×48px (buttons, icons).

## Supabase client usage

| Client | File | When to use |
|---|---|---|
| `createClient()` | `src/lib/supabase/server.ts` | Server Components, Server Actions — respects RLS |
| `createClient()` | `src/lib/supabase/client.ts` | Client Components — respects RLS |
| `createAdminClient()` | `src/lib/supabase/admin.ts` | Admin/webhook code only — **bypasses RLS** |

`getUser()`, `getIsAdmin()`, `getBusinessCompanyId()` in `server.ts` are `cache()`-wrapped — safe to call multiple times per request without extra DB round-trips.

## RLS summary

| Table | Public read | Auth write | Notes |
|---|---|---|---|
| companies | yes | admin only | score/avg updated by DB triggers |
| reviews | yes | own user | anonymous flag respected in UI only |
| favorites | no | own user | |
| profiles | no | own user | |
| ad_campaigns | active only | own company | admin bypasses via service role |
| ad_impressions | no | anyone | geo tracking (viewer_canton, viewer_city) |
| ad_clicks | no | anyone | geo tracking (viewer_canton) |
| company_views | no | anyone | business can read own |
| company_claims | no | anyone submit | admin reviews |

## Ad tracking flow

1. `trackAdImpression(campaignId)` — inserts into `ad_impressions` (with geo), then calls `increment_ad_impression` RPC.
2. The RPC atomically: increments `impression_count`, adds CPM cost to `spent_chf`, auto-sets `status = 'completed'` when budget exhausted.
3. Daily stats are computed in JS from raw impression/click rows (not from the DB views, which are unused).
4. `getActiveAds()` filters by `status = 'active'`, date range, and remaining budget. Fisher-Yates shuffle for fair rotation.

## Auth

- `next` redirect param validated with `/^\/(?![/\\])/` to prevent open redirect.
- Google OAuth via Supabase — `redirectTo` always points to `/auth/callback?next=...`.
- Password reset: email → `/auth/callback?next=/reset-password`.

## File upload paths (Supabase Storage)

| Bucket | Path pattern | Used for |
|---|---|---|
| avatars | `{userId}/{uuid}.{ext}` | Profile avatar |
| covers | `covers/{companyId}/{uuid}.{ext}` | Company covers |
| covers | `ads/{companyId}/{uuid}.{ext}` | Ad campaign images |
