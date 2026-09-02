import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workie : avis et salaires des entreprises suisses",
    short_name: "Workie",
    description: "Avis anonymes, salaires et culture des entreprises suisses.",
    start_url: "/explore",
    display: "standalone",
    background_color: "#0d0d0f",
    theme_color: "#8b5cf6",
    lang: "fr-CH",
    icons: [
      { src: "/icon.svg",       sizes: "any",         type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-icon.svg", sizes: "180x180",     type: "image/svg+xml" },
    ],
    categories: ["business", "social"],
  };
}
