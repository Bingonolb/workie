import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Workie — Les entreprises, sans filtre.",
  description: "Découvre les vraies conditions de travail des entreprises suisses. Avis anonymes, salaires, culture — la vérité que Glassdoor ne te dit pas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ background: "#0d0d13" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
