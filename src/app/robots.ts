import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/explore", "/company/", "/ranking", "/salaires", "/jobs"],
        disallow: ["/admin", "/business/dashboard", "/api/", "/profile", "/favorites"],
      },
    ],
    sitemap: "https://www.workie.ch/sitemap.xml",
  };
}
