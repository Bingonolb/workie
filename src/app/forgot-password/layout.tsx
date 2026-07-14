import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mot de passe oublié · Workie",
  description: "Réinitialise ton mot de passe Workie. Reçois un lien par email pour accéder à nouveau à ton compte.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
