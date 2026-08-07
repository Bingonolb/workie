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
import "./globals.css";
import { Suspense } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { WelcomeModal } from "@/components/WelcomeModal";
import { SessionKeepAlive } from "@/components/SessionKeepAlive";

const OG_URL = "/api/og?title=Workie+%E2%80%94+Les+entreprises+suisses%2C+sans+filtre.&sub=Avis+anonymes+%C2%B7+Salaires+%C2%B7+Culture";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.workie.ch"),
  title: {
    default: "Workie — Les entreprises, sans filtre.",
    template: "%s · Workie",
  },
  description: "Découvre les vraies conditions de travail des entreprises suisses. Avis anonymes, salaires, culture — la vérité que Glassdoor ne te dit pas.",
  keywords: ["avis entreprise suisse", "salaires suisse", "conditions de travail", "glassdoor suisse", "workie"],
  authors: [{ name: "Workie", url: "https://www.workie.ch" }],
  creator: "Workie",
  publisher: "Workie",
  alternates: { canonical: "https://www.workie.ch" },
  openGraph: {
    siteName: "Workie",
    locale: "fr_CH",
    type: "website",
    url: "https://www.workie.ch",
    images: [{ url: OG_URL, width: 1200, height: 630, alt: "Workie — Les entreprises suisses, sans filtre." }],
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
  description: "Avis anonymes sur les entreprises suisses — salaires, culture, management.",
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
    <html lang="fr">
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
