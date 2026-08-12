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

## Business access rules

| Condition | Access |
|---|---|
| `claimed_company_id` set + authenticated | Dashboard layout, Ads (own payment flow) |
| `is_subscribed = true` OR `role = admin` | Analytics, review replies, job offers, full dashboard |
| `role = admin` | Admin panel, bypass all subscription checks |

**Rule**: Never put `redirect("/business/checkout")` in a layout — it blocks sub-sections with their own payment logic. Each page checks its own requirements. The layout only checks authentication + `claimed_company_id`.

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

## Cloisonnement des comptes — règle absolue

Les pages personnelles (`/profile`, `/favorites`, fiches) sont des **coquilles statiques** : le HTML est partagé par tous les visiteurs et ne contient jamais de donnée personnelle. Tout ce qui est personnel arrive ensuite, par une route d'API en `private, no-store`.

**Toute mise en mémoire d'une donnée personnelle côté client doit être liée à un compte.** Un cache global non marqué survit au changement de compte dans le même onglet et sert les données du compte précédent. C'est arrivé le 2026-08-09 : un nouveau compte affichait le nom d'un autre utilisateur.

Trois contrôles obligatoires, indépendants (`src/lib/cacheSession.ts`) :

1. l'entrée mémorisée porte l'identifiant du compte qui l'a écrite ;
2. la réponse du serveur déclare son destinataire dans un champ `compte`, revérifié à la lecture ;
3. rien n'est lu quand aucun compte n'est identifiable (déconnexion, cookie illisible).

Toute route d'API renvoyant des données personnelles **doit** inclure `compte: user.id`.

`src/__tests__/cloisonnement-comptes.test.ts` garde ces invariants. Si un de ces tests tombe, la fuite est de retour : corriger le cache, jamais le test.

## Ne pas dériver un état d'une propriété avec `useState`

`useState(propriete)` ne lit sa valeur qu'au premier rendu. Sur des pages statiques, où favoris, votes et notifications arrivent **après**, l'état reste alors figé sur la valeur initiale — la flamme d'une entreprise enregistrée restait éteinte, et le clic suivant la retirait.

Utiliser `useEtatSynchronise` (`src/lib/useEtatSynchronise.ts`), qui ajuste pendant le rendu et ne resynchronise que lorsque la propriété change réellement, de sorte qu'un clic optimiste survit aux rendus du parent.

## Une bascule n'est jamais un ajout

`basculer()` appelée à la place de `poser()` produit l'inverse de l'effet voulu quand l'état existe déjà. `toggleFavorite` appelait `addFlame` pour poser une flamme : sur une entreprise déjà enflammée, enregistrer le favori la supprimait. Exposer des intentions explicites (`poserFlamme` / `retirerFlamme`) et laisser l'appelant choisir.

## Ne pas afficher n'est pas ne pas transmettre

Le texte des avis — `title`, `content`, `pros`, `cons` — n'est **jamais** affiché sur une fiche entreprise. Ce choix ne tient pas si les colonnes sont quand même sélectionnées : elles partent alors dans les données de la page, invisibles à l'écran mais lisibles dans le code source.

La fiche publique lit `REVIEW_FICHE_COLS`, qui les exclut. `REVIEW_PUBLIC_COLS` reste réservé à ce que l'auteur peut voir de ses propres avis — son profil et son export.

Même principe partout : la question n'est pas « est-ce affiché ? » mais « est-ce envoyé ? ».

## Pas de tiret cadratin dans le texte visible

Le tiret cadratin en incise (`—`) est une ponctuation anglo-saxonne. En
français, on écrit deux-points quand il introduit une explication, une virgule
quand il sépare, des parenthèses quand il encadre.

La règle porte sur tout ce que l'utilisateur lit : pages, composants, titres,
descriptions, `metadata`, données structurées, libellés Stripe, sujets et
gabarits d'e-mail, manifeste PWA. Les commentaires de code ne sont pas
concernés, et le tiret seul comme valeur absente (`—` dans une colonne vide)
reste : c'est une convention de tableau, pas une ponctuation de phrase.

## Région d'exécution : au plus près de la base

Le projet Supabase est en `eu-west-1`, la région AWS d'Irlande. Sans
configuration, Vercel exécute les fonctions à `iad1`, en Virginie du Nord :
chaque requête en base et chaque validation de jeton traversait alors
l'Atlantique deux fois. Mesuré avant correction sur une session réelle,
`/api/user/favorites` répondait en 1 103 ms pour 37 lignes.

Le critère est la distance à la **base**, pas aux utilisateurs. Les pages
elles-mêmes sont servies depuis le cache du réseau de diffusion, au plus près
du visiteur, quelle que soit la région des fonctions. Exécuter à Zurich pour
« être près des Suisses » rallongerait chaque aller-retour vers l'Irlande sans
rien accélérer de ce qui est déjà en cache.

`vercel.json` fixe `regions: ["dub1"]`, la région Vercel de Dublin. Toute nouvelle route serveur en
hérite ; il n'y a rien à répéter par fichier. Si la base est un jour déplacée,
c'est ce fichier qu'il faut suivre.

L'en-tête `x-vercel-id` dit où la requête a été traitée : `fra1::dub1::…`
signifie entrée à Francfort, exécution à Dublin. Un `::iad1::` signale que le
réglage n'est pas appliqué.
