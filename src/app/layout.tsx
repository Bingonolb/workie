import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};
import "./globals.css";
import { Suspense } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { CookieBanner } from "@/components/CookieBanner";
import { WelcomeModal } from "@/components/WelcomeModal";
import { SessionKeepAlive } from "@/components/SessionKeepAlive";

export const metadata: Metadata = {
  title: "Workie — Les entreprises, sans filtre.",
  description: "Découvre les vraies conditions de travail des entreprises suisses. Avis anonymes, salaires, culture — la vérité que Glassdoor ne te dit pas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Apply theme before paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('workie-theme');if(t==='light')document.documentElement.classList.add('light');else document.documentElement.classList.remove('light');}catch(e){}})()` }} />
      </head>
      <body style={{ background: "var(--bg)", overflowX: "clip", width: "100%", position: "relative" }}>
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
