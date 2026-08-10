import type { Metadata } from "next";

export const metadata: Metadata = {
  // Aucune valeur dans un index de recherche, et une page de mot de passe qui
  // remonte sur une requête de marque dessert le site. Comme /login et
  // /signup, qui portaient déjà cette directive.
  robots: { index: false, follow: false },
  title: "Mot de passe oublié · Workie",
  description: "Réinitialise ton mot de passe Workie. Reçois un lien par email pour accéder à nouveau à ton compte.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
