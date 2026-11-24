import { describe, it, expect, beforeAll, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Le middleware sert chaque page dans sa langue, sans changer l'adresse.
 * Ces tests gardent les règles qui, mal écrites, rendent tout le site
 * introuvable (une page prise pour un fichier n'est plus servie du tout).
 */
vi.stubEnv("NEXT_PUBLIC_LANGUES", "fr,de");

async function passer(url: string, cookie?: string) {
  vi.resetModules();
  const { middleware } = await import("@/middleware");
  const req = new NextRequest(new URL(url, "https://workie.ch"), { headers: cookie ? { cookie } : {} });
  return middleware(req);
}
const reecrit = (r: Response) => r.headers.get("x-middleware-rewrite");

describe("middleware : langue", () => {
  // Premier chargement (compilation) fait à part : en parallèle avec toute la
  // suite, il dépassait les 5 s du premier test.
  beforeAll(async () => { await import("@/middleware"); }, 60_000);

  it("sert une page sans préfixe en français, à la même adresse", async () => {
    const r = await passer("/explore");
    expect(reecrit(r)).toBe("https://workie.ch/fr/explore");
  });

  it("sert l'accueil en français", async () => {
    expect(reecrit(await passer("/"))).toBe("https://workie.ch/fr");
  });

  it("suit la langue choisie (cookie)", async () => {
    expect(reecrit(await passer("/entreprise/givaudan", "workie_langue=de"))).toBe("https://workie.ch/de/entreprise/givaudan");
  });

  it("ignore une langue choisie qui n'est pas ouverte", async () => {
    expect(reecrit(await passer("/explore", "workie_langue=it"))).toBe("https://workie.ch/fr/explore");
  });

  it("garde le préfixe d'adresse (/de/…)", async () => {
    expect(reecrit(await passer("/de/explore"))).toBe("https://workie.ch/de/explore");
  });

  it("renvoie /fr/… vers la racine", async () => {
    const r = await passer("/fr/explore");
    expect(r.status).toBe(308);
    expect(r.headers.get("location")).toBe("https://workie.ch/explore");
  });

  it("ne touche ni à l'API ni aux fichiers", async () => {
    for (const c of ["/api/offres", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]) {
      expect(reecrit(await passer(c))).toBeNull();
    }
  });

  it("une page protégée sans session renvoie à la connexion, préfixe gardé", async () => {
    const r = await passer("/de/profile/ads");
    expect(r.headers.get("location")).toMatch(/^https:\/\/workie\.ch\/de\/login\?next=/);
  });
});
