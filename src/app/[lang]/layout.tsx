import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#0d0d0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};
import { Inter } from "next/font/google";
import "../globals.css";
import { notFound } from "next/navigation";
import { OUVERTES, estOuverte, LOCALE_INTL } from "@/i18n/config";
import { messagesDe } from "@/i18n/serveur";
import { FournisseurLangue } from "@/i18n/FournisseurLangue";
import { Suspense } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { WelcomeModal } from "@/components/WelcomeModal";
import { SessionKeepAlive } from "@/components/SessionKeepAlive";

/**
 * Une seule police, servie depuis notre propre domaine.
 *
 * Le site s'en remettait à la police du système : Segoe UI sous Windows, San
 * Francisco sur Mac, autre chose ailleurs. Le site n'avait donc pas le même
 * visage selon la machine, ce qu'aucune plateforme sérieuse ne se permet.
 *
 * Inter est la grotesque libre la plus proche de la tradition helvétique, ce
 * qui tombe bien pour un service suisse : la neutralité y est un parti pris,
 * pas une absence de choix. `next/font` la télécharge à la compilation et la
 * sert depuis notre origine, ce qui satisfait `font-src 'self'` sans ouvrir
 * la politique de sécurité à un hébergeur tiers, et supprime le clignotement
 * d'une police chargée après coup.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--police",
  weight: ["400", "500", "600", "700", "800"],
});


// L'image de secours du site entier. Les pages qui ne déclarent pas de bloc
// `openGraph` reçoivent de toute façon `src/app/opengraph-image.png`, câblé par
// Next ; cette adresse sert aux autres.
const OG_URL = "https://www.workie.ch/opengraph-image.png";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.workie.ch"),
  title: {
    default: "Workie : chercher du travail devient passionnant",
    template: "%s · Workie",
  },
  description: "Découvrez des entreprises suisses, trouvez celles qui vous correspondent et accédez directement à leurs offres d'emploi.",
  keywords: ["emploi suisse", "employeurs suisses", "offres d'emploi suisse", "entreprises suisses", "chercher du travail en suisse", "workie"],
  authors: [{ name: "Workie", url: "https://www.workie.ch" }],
  creator: "Workie",
  publisher: "Workie",
  alternates: { canonical: "https://www.workie.ch" },
  openGraph: {
    siteName: "Workie",
    locale: "fr_CH",
    type: "website",
    url: "https://www.workie.ch",
    images: [{ url: OG_URL, width: 1200, height: 630, alt: "Workie : chercher du travail en Suisse" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@workiech",
    images: [OG_URL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Workie",
  url: "https://www.workie.ch",
  description: "Découvrez les entreprises suisses et trouvez leurs offres d'emploi.",
  inLanguage: "fr-CH",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: "https://www.workie.ch/explore?q={search_term_string}" },
    "query-input": "required name=search_term_string",
  },
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Workie",
  url: "https://www.workie.ch",
  // Le fichier déclaré ici n'a jamais existé : /icon.svg répond 404, et
  // l'icône du site est servie par Next à /icon.png. Google lit ce champ pour
  // le logo du panneau de connaissance ; une adresse morte lui donnait donc
  // une image de moins, sans erreur visible nulle part.
  logo: "https://www.workie.ch/icon.png",
  sameAs: [],
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "contact@workie.ch", availableLanguage: ["French", "German"] },
};

/**
 * Une version de chaque page par langue ouverte, générée et mise en cache
 * séparément. Une langue non ouverte (ou inventée) répond 404 : elle n'est
 * jamais servie à moitié traduite.
 */
export function generateStaticParams() {
  return OUVERTES.map(lang => ({ lang }));
}
export const dynamicParams = false;

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!estOuverte(lang)) notFound();
  const messages = await messagesDe(lang);
  return (
    <html lang={LOCALE_INTL[lang]} className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://xtbdxfzbbuedlktpqpna.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://xtbdxfzbbuedlktpqpna.supabase.co" />
        <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        {/* Apply theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('workie-theme');if(t==='light')document.documentElement.classList.add('light');else document.documentElement.classList.remove('light');}catch(e){}})()` }} />
      </head>
      <body style={{ background: "var(--bg)", overflowX: "clip", width: "100%", position: "relative" }}>
        <a href="#main-content" className="skip-to-main">
          Aller au contenu principal
        </a>
        <FournisseurLangue langue={lang} messages={messages}>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <SessionKeepAlive />
          <CookieBanner />
          <Suspense><WelcomeModal /></Suspense>
        </ThemeProvider>
        </FournisseurLangue>
      </body>
    </html>
  );
}
