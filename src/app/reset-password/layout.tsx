import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouveau mot de passe · Workie",
  description: "Choisis un nouveau mot de passe pour ton compte Workie.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
