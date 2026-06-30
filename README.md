# WatchSwap

Application web "Tinder pour montres" : tu listes tes montres, tu swipes celles des autres, et quand vous vous likez mutuellement (toi sa montre, lui une des tiennes), un match se crée et vous pouvez discuter en temps réel pour organiser l'échange.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript + Tailwind CSS
- **Supabase** : Auth (email/mot de passe), Postgres (schéma ci-dessous), Storage (photos), Realtime (chat)
- **Framer Motion** pour le swipe façon Tinder, **Lucide** pour les icônes
- Déploiement cible : **Vercel**, code source sur **GitHub**, développement local dans **VS Code**

## Fonctionnalités

- Inscription / connexion par email + mot de passe
- Ajout de montres (marque, modèle, année, état, description, ville, jusqu'à 5 photos)
- Gestion de ses montres (pause, réactivation, suppression)
- Swipe deck (glisser à la souris/au doigt ou boutons J'aime / Passer / Super-like / Annuler)
- Détection automatique des matchs réciproques (trigger SQL côté base de données)
- Pop-up "It's a Match!"
- Messagerie en temps réel par match (Supabase Realtime)
- Page "Mes échanges" listant tous les matchs
- Filtres par marque / état sur le fil de découverte
- Profil utilisateur avec photo, ville, bio

## Pensé pour passer à l'échelle (100k+ utilisateurs)

- Le fil "Découvrir" est servi par une fonction SQL (`get_discover_feed`) qui exclut les montres déjà vues côté base de données via un `NOT EXISTS` indexé, avec pagination par curseur (`created_at`) — pas de chargement de toute la table en mémoire.
- Toutes les clés étrangères et colonnes de filtre (`owner_id`, `status`, `created_at`, `swiper_id`, `target_watch_id`, etc.) sont indexées.
- Les policies RLS utilisent `(select auth.uid())` plutôt que `auth.uid()` pour que Postgres évalue la fonction une seule fois par requête plutôt qu'une fois par ligne (recommandation officielle Supabase pour la perf à grande échelle).
- La détection de match est faite par un trigger Postgres (`handle_new_swipe`), donc atomique et sans race condition côté serveur applicatif.
- Les photos sont servies depuis Supabase Storage (CDN), pas depuis le serveur Next.js.
- Supabase gère nativement le pooling de connexions (pgbouncer) — pas de configuration supplémentaire nécessaire pour scaler les connexions DB.

À surveiller quand le trafic grossira réellement : passer le plan Supabase en payant (le tier gratuit a des limites de stockage/bande passante), envisager un cache (Redis/Vercel KV) pour le fil de découverte si besoin, et un CDN d'images avec resize automatique (Supabase Storage le permet via les "image transformations").

## Schéma de base de données

Tables : `profiles`, `watches`, `swipes`, `matches`, `messages`.
Tout est déjà créé et configuré sur le projet Supabase `watchswap` (RLS activé partout, policies, buckets storage `watch-photos` et `avatars`, realtime activé sur `messages`).

## Lancer le projet en local (VS Code)

1. Installer [Node.js 20+](https://nodejs.org) et [VS Code](https://code.visualstudio.com/).
2. Ouvrir le dossier `watchswap` dans VS Code.
3. Ouvrir un terminal (`` Ctrl+` ``) et lancer :
   ```bash
   npm install
   npm run dev
   ```
4. Ouvrir [http://localhost:3000](http://localhost:3000).

Le fichier `.env.local` contient déjà les clés Supabase du projet `watchswap` créé pour toi (URL + clé publique). Ne les partage pas publiquement si le repo GitHub est en mode privé non souhaité — sinon régénère-les depuis le dashboard Supabase.

## Mettre le code sur GitHub

1. Va sur [github.com/new](https://github.com/new), crée un nouveau repo (ex: `watchswap`), ne coche aucune case d'initialisation (pas de README/gitignore, ils existent déjà).
2. Dans le terminal VS Code, à la racine du projet :
   ```bash
   git remote add origin https://github.com/TON-PSEUDO/watchswap.git
   git branch -M main
   git push -u origin main
   ```
3. Rafraîchis la page GitHub : ton code est en ligne.

## Déployer sur Vercel

1. Va sur [vercel.com/new](https://vercel.com/new) et connecte-toi avec ton compte GitHub.
2. Sélectionne le repo `watchswap` puis clique sur **Import**.
3. Vercel détecte automatiquement Next.js. Avant de cliquer sur **Deploy**, ouvre la section **Environment Variables** et ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xtbdxfzbbuedlktpqpna.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_5TZfXHC5G9n99L8GF7XEBA_RLcRsOmv`
4. Clique sur **Deploy**. En ~1 minute, ton site est en ligne sur une URL `watchswap-xxxx.vercel.app`.
5. À chaque `git push` sur `main`, Vercel redéploie automatiquement.

Tu peux ensuite ajouter un nom de domaine personnalisé dans Vercel → Project Settings → Domains.

## Administrer la base de données

Dashboard Supabase du projet : [supabase.com/dashboard/project/xtbdxfzbbuedlktpqpna](https://supabase.com/dashboard/project/xtbdxfzbbuedlktpqpna)
Tu peux y voir les tables, les utilisateurs inscrits, les logs, et ajuster le plan tarifaire si le trafic grossit.

## Pistes d'amélioration

- Génération des types TypeScript stricts depuis le schéma Supabase (`supabase gen types typescript`) pour remplacer le type `Database = any` actuel.
- Notifications push/email quand on reçoit un match ou un message.
- Vérification d'identité / système de notation des échanges pour la confiance entre utilisateurs.
- Pagination optimisée des conversations si un utilisateur a beaucoup de matchs.
- Tests automatisés (actuellement non inclus).
