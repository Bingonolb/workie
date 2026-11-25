import type { Metadata } from "next";
import { meta } from "@/i18n/meta";

export const generateMetadata = () => meta({ titre: "meta.nouveauTitre", description: "meta.nouveauDescription", indexer: false });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
