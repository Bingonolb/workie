import type { Metadata } from "next";

export const metadata: Metadata = {
  // Aucune valeur dans un index de recherche, et une page de mot de passe qui
  // remonte sur une requête de marque dessert le site. Comme /login et
  // /signup, qui portaient déjà cette directive.
  robots: { index: false, follow: false },
  title: "Mot de passe oublié · Workie",
  description: "Réinitialisez votre mot de passe Workie. Vous recevez un lien par courriel pour accéder à nouveau à votre compte.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
