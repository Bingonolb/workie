import type { Metadata } from "next";
import { meta } from "@/i18n/meta";

export const generateMetadata = () => meta({ titre: "meta.oublieTitre", description: "meta.oublieDescription", indexer: false });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
