import type { MetadataRoute } from "next";

/**
 * Ce que les moteurs ont le droit d'explorer.
 *
 * Google signalait des pages « avec redirection » et « exclues par noindex ».
 * Rien d'anormal : ce sont les espaces personnels, qui renvoient vers la
 * connexion et portent une directive noindex. Mais Google les découvrait et
 * les explorait pour rien, ce qui produit ces avertissements à répétition.
 *
 * On les écarte donc explicitement, ainsi que les pages d'authentification :
 * elles n'ont aucune valeur dans un index de recherche, et une page de
 * connexion qui remonte sur une requête de marque dessert le site.
 *
 * À ne pas confondre avec une protection : robots.txt est une consigne, pas
 * une barrière. L'accès à ces pages est refusé par le middleware, et les
 * données par les politiques de la base.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/company/", "/ranking", "/salaires", "/jobs"],
        disallow: [
          "/admin",
          "/api/",
          // Espaces personnels
          "/profile",
          "/favorites",
          "/notifications",
          // Parcours d'authentification
          "/login",
          "/signup",
          "/auth/",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: "https://www.workie.ch/sitemap.xml",
  };
}
