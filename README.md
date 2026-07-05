# Workie

**Workie** is a Swiss company review platform — think Glassdoor but built for the Swiss market with a Gen Z audience in mind. Employees leave anonymous reviews, rate companies, share salary data, and the community up- or down-votes companies through a real-time scoring system.

---

## Table of Contents

1. [Description](#description)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Local Setup](#local-setup)
5. [Data Model](#data-model)
6. [Scoring Formula](#scoring-formula)
7. [Authentication Flow](#authentication-flow)
8. [Key Features](#key-features)
9. [Contribution Guide](#contribution-guide)

---

## Description

Workie lets Swiss professionals find reliable, uncensored information about companies before they join. Key design principles:

- Reviews are **100% anonymous by default** — only job title and tenure duration are shown.
- A **gamified scoring system** (flames, boosts, penalties) produces a live company ranking.
- Guest users can browse but are gated after the first swipe / first review; a `GuestModal` prompts sign-up.
- The admin panel (`/admin`) lets privileged users create, update, and delete companies.

Target audience: Swiss professionals, recent graduates, and job-seekers aged 20–35.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, inline styles (no CSS framework) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth — Google OAuth + email/password |
| ORM / SDK | `@supabase/ssr` (server + browser clients) |
| File Storage | Supabase Storage (`avatars` bucket) |
| Deployment | Vercel (auto-deploy on `git push main`) |
| Icons | `lucide-react` |

---

## Folder Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (QueryProvider wrapper)
│   ├── page.tsx                # Landing page (guests only)
│   ├── login/page.tsx          # Email + Google login
│   ├── signup/page.tsx         # Email registration
│   ├── explore/
│   │   ├── page.tsx            # Grid + Swipe view of companies
│   │   ├── SwipeView.tsx       # Tinder-style swipe client component
│   │   ├── ExploreFilters.tsx  # Sector / city / search filters
│   │   └── Pagination.tsx      # Page controls (logged-in only)
│   ├── company/[id]/page.tsx   # Company detail + reviews + review form
│   ├── ranking/
│   │   ├── page.tsx            # Ranking page (top 100)
│   │   └── RankingList.tsx     # Ranked table component
│   ├── favorites/page.tsx      # User's saved companies
│   ├── profile/
│   │   ├── page.tsx            # Profile dashboard (reviews + edit form)
│   │   └── ProfileReviews.tsx  # User's review history table
│   ├── admin/
│   │   ├── page.tsx            # Admin company list
│   │   └── company/[id]/       # Create / edit company form
│   └── auth/callback/route.ts  # Google OAuth callback handler
│
├── components/                 # Shared UI components
│   ├── Navbar.tsx              # Top navigation (Server Component)
│   ├── CompanyCard.tsx         # Card used in grid view
│   ├── ReviewForm.tsx          # 3-step multi-page review wizard
│   ├── GuestModal.tsx          # Bottom-sheet paywall for guests
│   ├── ProfileForm.tsx         # Profile edit form
│   ├── ParallaxCover.tsx       # Cover image with parallax effect
│   └── AuthFormWorkie.tsx      # Login / signup form component
│
└── lib/
    ├── types.ts                # TypeScript interfaces (Company, Review, Profile)
    ├── constants.ts            # PAGE_SIZE = 12
    ├── supabase/
    │   ├── server.ts           # Server-side Supabase client + getUser() (React cache)
    │   ├── client.ts           # Browser-side Supabase client
    │   ├── admin.ts            # Service-role client (bypasses RLS — server only)
    │   └── middleware.ts       # Session refresh + route protection
    └── actions/
        ├── auth.ts             # signUp, signIn, signOut, signInWithGoogle
        ├── companies.ts        # getCompanies, getCompany, getAllCompaniesForSwipe, getCompanyNames
        ├── reviews.ts          # getReviews, getUserReviews, submitReview, voteHelpful
        ├── scores.ts           # addFlame, addBoost, addPenalty, getTopCompanies, getUserFlameIds
        ├── favorites.ts        # toggleFavorite, getFavorites, getUserFavoriteIds
        ├── profile.ts          # updateProfile (with avatar upload)
        └── admin.ts            # adminAddCompany, adminUpdateCompany, adminDeleteCompany
```

---

## Local Setup

### 1. Prerequisites

- Node.js 20+
- A Supabase project (project ID: `xtbdxfzbbuedlktpqpna`)

### 2. Clone and install

```bash
git clone <repo-url>
cd workie
npm install
```

### 3. Environment variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xtbdxfzbbuedlktpqpna.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to expose in the browser.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — **never expose it client-side**.
- `NEXT_PUBLIC_SITE_URL` is used to build the Google OAuth redirect URL.

### 4. Run locally

```bash
npm run dev
```

The app starts at `http://localhost:3000`.

---

## Data Model

### `companies`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `zefix_uid` | text | Swiss company registry ID |
| `name` | text | |
| `sector` | text | One of 9 predefined sectors |
| `subsector` | text | Optional |
| `city` | text | |
| `canton` | text | Optional |
| `employee_range` | text | e.g. `"51-200"` |
| `description` | text | |
| `logo_url` | text | |
| `cover_url` | text | Stored in Supabase Storage `avatars` bucket |
| `website_url` | text | |
| `linkedin_url` | text | |
| `avg_rating` | numeric | Maintained by DB trigger or function |
| `review_count` | int | Maintained by DB trigger or function |
| `avg_salary_chf` | numeric | |
| `tags` | text[] | |
| `is_verified` | bool | Admin-controlled |
| `score` | int | Computed — see formula below |
| `founded_year` | int | |

### `reviews`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK → companies | |
| `user_id` | uuid FK → auth.users | nullable |
| `rating_overall` | int 1–5 | Required |
| `rating_culture` | int 1–5 | Optional |
| `rating_management` | int 1–5 | Optional |
| `rating_worklife` | int 1–5 | Optional |
| `rating_career` | int 1–5 | Optional |
| `title` | text | Optional |
| `content` | text | Min. 50 chars |
| `pros` | text | Min. 10 chars |
| `cons` | text | Min. 10 chars |
| `job_title` | text | Required |
| `salary_chf` | numeric | Optional, anonymized |
| `is_current` | bool | Current or former employee |
| `is_anonymous` | bool | Always `true` currently |
| `employment_type` | enum | `cdi / cdd / stage / alternance / freelance` |
| `duration_range` | text | `moins_6mois / 6mois_2ans / plus_2ans` |
| `work_mode` | enum | `présentiel / hybride / remote` |
| `would_recommend` | enum | `oui / non / ca_depend` |
| `knew_before` | text | Optional advice |
| `helpful_count` | int | Incremented by `increment_helpful` RPC |

### `score_events`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `company_id` | uuid FK | |
| `user_id` | uuid FK | |
| `event_type` | text | `flame / boost / penalty` |
| `points` | int | +1 (flame), +100 (boost), -100 (penalty) |

One flame per user per company (toggle). Boost is one-time; penalty is admin-only.

### `favorites`

| Column | Type |
|---|---|
| `user_id` | uuid FK |
| `company_id` | uuid FK |
| `created_at` | timestamptz |

### `profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid FK → auth.users | |
| `username` | text | |
| `full_name` | text | |
| `avatar_url` | text | |
| `city` | text | |
| `country` | text | |
| `bio` | text | |
| `role` | text | `"admin"` for admin users |

### `review_votes`

| Column | Type |
|---|---|
| `user_id` | uuid FK |
| `review_id` | uuid FK |

Used to prevent duplicate "helpful" votes.

---

## Scoring Formula

The company score is calculated as:

```
score = ROUND(avg_rating * 20 * LN(review_count + 1)) + SUM(score_events.points)
```

- `avg_rating` — average of all `rating_overall` values (1–5 scale)
- `review_count` — total number of reviews for the company
- The logarithm dampens the effect of very high review counts, rewarding quality over quantity
- `score_events.points` — community contributions: flames (+1), boosts (+100), penalties (-100)

The `score` column on the `companies` table must be kept in sync by a Supabase database function or trigger whenever a review or score event is inserted, updated, or deleted.

---

## Authentication Flow

### Email / Password

1. User fills the form on `/signup` or `/login`
2. The form submits to a Server Action (`signUp` / `signIn` in `src/lib/actions/auth.ts`)
3. The action calls `supabase.auth.signUp()` or `supabase.auth.signInWithPassword()`
4. On success, `redirect("/explore")` is called server-side

### Google OAuth

1. User clicks "Continuer avec Google" (on `/login`, `/signup`, or `GuestModal`)
2. A `<form action={signInWithGoogle}>` submits to the `signInWithGoogle` Server Action
3. The action calls `supabase.auth.signInWithOAuth({ provider: "google" })` and redirects to Google
4. Google redirects back to `NEXT_PUBLIC_SITE_URL/auth/callback`
5. The route handler at `src/app/auth/callback/route.ts` exchanges the code for a session via `supabase.auth.exchangeCodeForSession(code)`
6. User is redirected to `/explore`

### Session Management

- `src/lib/supabase/middleware.ts` refreshes the session cookie on every request and enforces route protection
- `getUser()` in `src/lib/supabase/server.ts` is memoized with React `cache()` — called at most once per server render even if `Navbar` and the page both invoke it
- Protected routes: `/profile`, `/favorites`, `/admin` redirect to `/login` if no session

### Admin Access

Admin status is checked by querying `profiles.role === "admin"`. This check is done in:
- `Navbar.tsx` — to show the Admin link
- `src/app/admin/page.tsx` — page-level redirect guard
- `src/lib/actions/admin.ts` — `requireAdmin()` helper (throws on failure)
- `src/lib/actions/scores.ts` — `addPenalty()` checks role before inserting

---

## Key Features

### SwipeView (`src/app/explore/SwipeView.tsx`)

Tinder-style card swipe built with pointer events (no external drag library).

- Swipe right → saves company as favorite + adds a flame (+1 score)
- Swipe left → passes
- Action buttons: pass (X), info (→ company page), flame/save, boost (+100), penalty (-100)
- Guests are limited to 1 swipe before `GuestModal` appears
- Cards show the next company underneath as a peek

### Company Ranking (`/ranking`)

Displays the top 100 companies ordered by `score DESC, avg_rating DESC, review_count DESC`. The scoring formula is explained inline.

### Guest Gating (`GuestModal`)

A bottom-sheet modal that appears:
- On `/company/[id]` after the first review preview (0.8s timer)
- In `SwipeView` after the first swipe
- Offers Google sign-in or email sign-up

### Review System (`ReviewForm`)

A 3-step wizard:
1. **Step 0 — Employment**: job title, contract type, tenure, work mode, optional salary
2. **Step 1 — Ratings**: overall star rating + 4 optional sub-ratings, would-recommend
3. **Step 2 — Review**: pros, cons, full review text, optional "what I wish I knew"

Server-side validation enforces: auth check, company existence, one-review-per-user-per-company, minimum length requirements. All reviews are stored as anonymous.

---

## Contribution Guide

### Branches

- `main` — production branch, auto-deployed to Vercel on push
- Feature work: create a branch from `main`, e.g. `feat/review-moderation`
- Do not push directly to `main` for significant changes — use a PR

### Commit Style

Use conventional commits:
```
feat: add review moderation queue
fix: correct score update on review delete
chore: bump supabase-ssr to 0.6
```

### Deployment

Vercel is connected to the `main` branch. Every push triggers an automatic deploy. Preview deployments are created for PRs.

Required environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` — must be set to the production domain

### Database Migrations

Use the Supabase dashboard or the Supabase CLI (`supabase db push`). The `createAdminClient()` in `src/lib/supabase/admin.ts` uses the service role key — it is server-only and must never be imported from a client component or committed to a public repository.

### Adding a New Sector

1. Add the sector string to `SECTORS` in `src/app/explore/page.tsx`
2. Add a color mapping to `SECTOR_COLORS` in `src/lib/types.ts`
3. Update the sector `<select>` in `src/app/admin/company/[id]/AdminCompanyForm.tsx`
