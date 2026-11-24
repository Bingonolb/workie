import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { type NextRequest, NextResponse } from "next/server";
import { LANGUES, COOKIE_LANGUE, LANGUE_PAR_DEFAUT, estOuverte, type Langue } from "@/i18n/config";

/**
 * Langue de la page demandée.
 *
 * Les adresses ne changent pas : workie.ch/explore reste workie.ch/explore.
 * La langue vient du préfixe s'il y en a un (/de/explore, adresse que Google
 * indexe), sinon du choix mémorisé (cookie), sinon du français. La page est
 * ensuite servie en coulisse depuis /<langue>/… : chaque langue a sa propre
 * version en cache, aussi rapide que l'actuelle.
 *
 * Ne concerne que les pages : ni l'API, ni les fichiers (robots.txt,
 * sitemap, icônes, manifeste).
 */
function langueDe(request: NextRequest): { lang: Langue; chemin: string; prefixe: Langue | null } {
  const { pathname } = request.nextUrl;
  const premier = pathname.split("/")[1];
  if ((LANGUES as readonly string[]).includes(premier)) {
    const chemin = pathname.slice(premier.length + 1) || "/";
    return { lang: premier as Langue, chemin, prefixe: premier as Langue };
  }
  const choisie = request.cookies.get(COOKIE_LANGUE)?.value;
  return { lang: estOuverte(choisie) ? choisie : LANGUE_PAR_DEFAUT, chemin: pathname, prefixe: null };
}
// Un fichier a une extension (« /robots.txt », « /icon.png ») ; une page non.
const estPage = (chemin: string) => !chemin.startsWith("/api") && !chemin.startsWith("/_next") && !/\.[a-z0-9]+$/i.test(chemin);

// Lazy init — if UPSTASH env vars are missing (e.g. Vercel plan migration), rate limiting is
// disabled rather than crashing the Edge Function for every request.
type RateLimiters = {
  search: Ratelimit; checkout: Ratelimit; actions: Ratelimit; auth: Ratelimit; export: Ratelimit;
};
let rl: RateLimiters | null = null;
try {
  // Le constructeur Redis accepte une url indéfinie sans se plaindre : le
  // try/catch ci-dessous ne suffisait donc pas à désactiver la limitation quand
  // les variables manquent. Résultat mesuré en production locale, sans ces
  // variables : /login et /signup répondaient en 4,35 s de façon parfaitement
  // reproductible, le temps que la requête vers une URL indéfinie échoue.
  // On vérifie donc explicitement leur présence.
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Upstash non configuré");

  const redis = new Redis({ url, token });
  rl = {
    search:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(150, "60s"), prefix: "rl:search",   ephemeralCache: new Map() }),
    checkout: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60s"),   prefix: "rl:checkout", ephemeralCache: new Map() }),
    actions:  new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(120, "60s"), prefix: "rl:actions",  ephemeralCache: new Map() }),
    auth:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "60s"),  prefix: "rl:auth",     ephemeralCache: new Map() }),
    export:   new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, "60s"),   prefix: "rl:export",   ephemeralCache: new Map() }),
  };
} catch {
  // Redis env vars not configured — rate limiting disabled until vars are added to Vercel
}

const PUBLIC_PATHS = [
  "/login", "/signup", "/auth",
  "/forgot-password", "/reset-password",
  "/explore", "/company", "/entreprise", "/emploi", "/pour-les-entreprises", "/revendiquer", "/creer-entreprise", "/ranking", "/annonceurs",
  "/api",
  "/cgu", "/confidentialite", "/mentions-legales",
  "/robots.txt", "/sitemap.xml", "/_next", "/favicon",
  // Le manifeste PWA doit rester lisible sans session, sinon l'installation
  // « Ajouter à l'écran d'accueil » échoue pour les visiteurs non connectés.
  "/manifest.webmanifest",
];

/**
 * Favoris et profil s'ouvrent aussi aux visiteurs (version sans compte), sur
 * le chemin exact seulement : /profile/ads et la suite restent privées. Elles
 * ne prennent pas le chemin rapide des pages publiques : pour un compte, la
 * session doit continuer d'y être rafraîchie.
 */
const PAGES_OUVERTES_SEULES = ["/favorites", "/profile"];

// Correspondance sur une frontière de segment : `startsWith` seul rendrait
// public toute route dont le nom *commence* par un préfixe listé (/apikeys
// serait couvert par "/api", /companyadmin par "/company"). Ici seuls le
// chemin exact et ses sous-chemins comptent.
function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  // Les fichiers que Next fabrique pour les métadonnées : image de partage,
  // icônes. Ils sont demandés par les robots de WhatsApp, LinkedIn ou Slack,
  // qui n'ont évidemment pas de session : sans cette ligne, l'aperçu d'un lien
  // Workie recevait la page de connexion à la place de l'image.
  //
  // Le motif porte sur la fin du chemin, car ces fichiers vivent aussi sous une
  // route : « /explore/opengraph-image » le jour où une page en déclare une.
  if (/\/(opengraph-image|twitter-image|icon|apple-icon)(-\w+)?$/.test(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * État de la session déduit du cookie seul, sans appel réseau.
 *
 * `supabase.auth.getUser()` valide le jeton auprès de Supabase : un
 * aller-retour réseau avant le moindre octet, sur *chaque* requête protégée.
 * Mesuré en local : 175 à 200 ms pour /profile et /favorites, contre 14 à
 * 25 ms pour /explore et /ranking qui prennent la voie rapide publique. Une
 * fois ces deux pages passées en statique, c'était tout ce qui restait.
 *
 * Or le middleware n'a qu'une décision à prendre : rediriger ou laisser
 * passer. La date d'expiration inscrite dans le jeton suffit pour ça, et elle
 * se lit sur place. On ne repasse par le réseau que près de l'expiration,
 * quand il faut réellement rafraîchir les cookies.
 *
 * Cette lecture ne vérifie pas la signature — elle n'a pas à le faire. Un
 * cookie fabriqué avec une expiration lointaine ne donne accès qu'à la
 * coquille statique, qui ne contient que la mise en page. Toute donnée
 * personnelle passe par getUser() côté serveur et par les politiques RLS, qui
 * eux vérifient la signature. Le middleware oriente ; il ne protège pas seul.
 */
function etatSession(request: NextRequest): "valide" | "a_rafraichir" | "absente" {
  // Le cookie de session est découpé en tranches (.0, .1, …) dès qu'il dépasse
  // la taille maximale d'un cookie. Il faut les recoller dans l'ordre.
  const tranches = request.cookies.getAll()
    .filter(c => /^sb-.*-auth-token(\.\d+)?$/.test(c.name))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  if (tranches.length === 0) return "absente";

  try {
    let brut = tranches.map(c => c.value).join("");
    if (brut.startsWith("base64-")) brut = atob(brut.slice(7));
    const jeton = JSON.parse(brut)?.access_token;
    if (typeof jeton !== "string") return "a_rafraichir";

    const charge = JSON.parse(atob(jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const exp = Number(charge?.exp);
    if (!Number.isFinite(exp)) return "a_rafraichir";

    // Marge de deux minutes : au-delà, on laisse Supabase rafraîchir plutôt
    // que de laisser un jeton expirer en cours de route.
    return exp * 1000 - Date.now() > 120_000 ? "valide" : "a_rafraichir";
  } catch {
    // Cookie illisible : on ne devine pas, on laisse Supabase trancher.
    return "a_rafraichir";
  }
}

export async function middleware(request: NextRequest) {
  try {
    const { lang, chemin: pathname, prefixe } = langueDe(request);
    const method = request.method;
    const page = estPage(pathname);
    // « /fr/… » n'existe pas en adresse : le français est à la racine.
    if (prefixe === "fr") {
      const url = request.nextUrl.clone();
      url.pathname = pathname;
      return NextResponse.redirect(url, 308);
    }
    /** La page dans sa langue, servie en coulisse ; le reste passe tel quel. */
    const suite = () => {
      if (!page) return suite();
      const url = request.nextUrl.clone();
      url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url, { request });
    };
    /** Une redirection garde le préfixe de langue de l'adresse d'origine. */
    const vers = (cible: string) => { const url = request.nextUrl.clone(); url.pathname = prefixe ? `/${prefixe}${cible}` : cible; return url; };
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
    const isServerAction = method === "POST" && !!request.headers.get("next-action");

    // Rate limiting — early return before touching Supabase.
    //
    // Chaque appel est isolé : le constructeur Redis ne lève pas quand les
    // variables Upstash manquent, donc `rl` est non-null même sans backend et
    // `limit()` lève à l'exécution. Sans cette isolation, l'exception remontait
    // au catch global du middleware, qui répond `next()` — l'authentification
    // était alors purement et simplement sautée sur les chemins limités.
    // Le rate limiting doit échouer en mode passant, jamais le contrôle d'accès.
    // Délai maximal : le client Upstash n'en impose aucun, donc un incident
    // chez eux ferait attendre chaque visiteur aussi longtemps que dure la
    // panne. La limitation de débit protège des abus ; elle ne doit jamais
    // devenir elle-même la cause d'une lenteur.
    const DELAI_MAX_MS = 500;

    const allowed = async (limiter: Ratelimit): Promise<boolean> => {
      try {
        const verdict = await Promise.race([
          limiter.limit(ip).then(r => r.success),
          new Promise<boolean>(resolve => setTimeout(() => resolve(true), DELAI_MAX_MS)),
        ]);
        return verdict;
      } catch {
        return true; // backend indisponible → on laisse passer, sans court-circuiter l'auth
      }
    };

    if (rl) {
      if (pathname === "/api/companies/search") {
        if (!await allowed(rl.search)) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
      if (method === "POST" && pathname === "/api/user/checkout-penalty") {
        if (!await allowed(rl.checkout)) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
      if (isServerAction) {
        if (!await allowed(rl.actions)) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
      if (pathname === "/api/user/export") {
        if (!await allowed(rl.export)) return NextResponse.json({ error: "Trop de requêtes. Attendez 1 minute." }, { status: 429 });
      }
      // Uniquement les tentatives, jamais les affichages.
      //
      // La condition ne regardait pas la méthode : afficher la page de
      // connexion consommait le quota au même titre qu'un essai de mot de
      // passe. Mesuré en production, dix chargements suffisaient à déclencher
      // le blocage — et l'utilisateur recevait du JSON brut à la place de la
      // page, sans avoir rien tenté. La protection contre le bourrinage doit
      // porter sur les envois de formulaire, pas sur la navigation.
      if (method === "POST" && /^\/(login|signup|forgot-password|reset-password)/.test(pathname)) {
        if (!await allowed(rl.auth)) return NextResponse.json({ error: "Trop de tentatives. Attendez une minute." }, { status: 429 });
      }
    }

    const isPublic = isPublicPath(pathname);
    const ouverteAuxVisiteurs = PAGES_OUVERTES_SEULES.includes(pathname);
    // Routes that redirect logged-in users elsewhere
    const isAuthRoute = pathname === "/" || pathname === "/login" || pathname === "/signup";

    // Fast path: public routes that don't need logged-in redirect → skip Supabase entirely
    // This eliminates ~100ms of auth latency for 80%+ of traffic (browse, explore, company pages)
    if (isPublic && !isAuthRoute) {
      return suite();
    }

    // Décision sans réseau tant que le jeton est valide. Voir etatSession :
    // c'est ce qui ramène les routes protégées au niveau des publiques.
    const etat = etatSession(request);

    if (etat === "absente") {
      if (!isPublic && !ouverteAuxVisiteurs) {
        const url = vers("/login");
        url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(url);
      }
      return suite();
    }

    if (etat === "valide") {
      if (isAuthRoute) {
        return NextResponse.redirect(vers("/explore"));
      }
      return suite();
    }

    // Jeton proche de l'expiration ou illisible : là seulement on passe par
    // Supabase, qui valide et réécrit les cookies rafraîchis.
    let response = suite();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = suite();
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const loggedIn = !!user;

    if (!loggedIn && !isPublic && !ouverteAuxVisiteurs) {
      const url = vers("/login");
      url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }

    if (loggedIn && isAuthRoute) {
      return NextResponse.redirect(vers("/explore"));
    }

    return response;
  } catch {
    // Filet de secours : la page en français plutôt qu'une page introuvable
    // (les pages n'existent que sous /<langue>/…).
    const { pathname } = request.nextUrl;
    if (!estPage(pathname) || /^\/(fr|de|en|it)(\/|$)/.test(pathname)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/fr${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|sw.js|service-worker.js|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
