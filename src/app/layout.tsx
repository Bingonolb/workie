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
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
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

/*
 * Le logotype seul, dans une geometrique.
 *
 * Le mot « workie » du nouveau logo est dessine dans une lineale geometrique :
 * o et e parfaitement circulaires, w a sommets pointus, point du i rond et
 * large. Inter, grotesque a l'axe vertical et aux terminaisons coupees, ne
 * peut pas rendre ce dessin. Poppins en est la plus proche parmi les polices
 * libres, et une seule graisse suffit puisque le mot n'apparait qu'a une
 * taille et une intensite.
 *
 * Elle ne sert qu'au logotype : le corps du site reste en Inter, qui se lit
 * mieux en petit et en paragraphe.
 */
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--police-logo",
  // Light, pas Regular. Les traits du mot fourni sont fins par rapport a la
  // hauteur des lettres ; en Regular le mot s'epaissit et perd l'elegance qui
  // fait tout le dessin.
  weight: ["300"],
});

const OG_URL = "/api/og?title=Workie&sub=Avis+et+salaires+des+entreprises+suisses";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.workie.ch"),
  title: {
    default: "Workie : avis et salaires des entreprises suisses",
    template: "%s · Workie",
  },
  description: "Les conditions de travail des entreprises suisses, notées anonymement par leurs employés. Rémunération, management, équilibre et évolution, sur huit critères.",
  keywords: ["avis entreprise suisse", "salaires suisse", "conditions de travail", "employeurs suisses", "workie"],
  authors: [{ name: "Workie", url: "https://www.workie.ch" }],
  creator: "Workie",
  publisher: "Workie",
  alternates: { canonical: "https://www.workie.ch" },
  openGraph: {
    siteName: "Workie",
    locale: "fr_CH",
    type: "website",
    url: "https://www.workie.ch",
    images: [{ url: OG_URL, width: 1200, height: 630, alt: "Workie : avis et salaires des entreprises suisses" }],
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
  description: "Avis anonymes sur les entreprises suisses : salaires, culture, management.",
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
  logo: "https://www.workie.ch/icon.svg",
  sameAs: [],
  contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "contact@workie.ch", availableLanguage: ["French", "German"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${poppins.variable}`}>
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
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <SessionKeepAlive />
          <CookieBanner />
          <Suspense><WelcomeModal /></Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
