import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workie : chercher du travail devient passionnant",
    short_name: "Workie",
    description: "Découvrez les entreprises suisses, gardez celles qui vous correspondent et trouvez leurs offres d'emploi.",
    start_url: "/explore",
    display: "standalone",
    background_color: "#0d0d0f",
    theme_color: "#101319",
    lang: "fr-CH",
    icons: [
      // Les deux fichiers déclarés ici étaient des SVG qui n'existent pas :
      // l'icône du site est un PNG, servi par Next à /icon.png. Un manifeste
      // qui pointe dans le vide ne produit aucune erreur visible, seulement
      // une icône grise au moment d'installer le site sur un téléphone.
      { src: "/icon.png",       sizes: "512x512",     type: "image/png", purpose: "any" },
      { src: "/icon.png",       sizes: "512x512",     type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180",     type: "image/png" },
    ],
    categories: ["business", "social"],
  };
}
