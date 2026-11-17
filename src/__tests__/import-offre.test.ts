import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("dns/promises", () => ({ lookup: vi.fn() }));
import { lookup } from "dns/promises";
import { importerOffreDepuisLien, htmlVersTexte } from "@/lib/importOffre";

/**
 * L'import d'offre fait partir une requête de nos serveurs vers une adresse
 * donnée par un client. Ces tests gardent deux promesses :
 *   1. on n'importe que ce qui est sûr (données structurées), jamais à moitié ;
 *   2. on ne peut pas s'en servir pour atteindre une adresse interne.
 * Si un test tombe, corriger le code, jamais le test.
 */

const page = (corps: string, statut = 200, entetes: Record<string, string> = {}) =>
  new Response(corps, { status: statut, headers: { "content-type": "text/html", ...entetes } });

const AVEC_OFFRE = `<html><head><script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [{ "@type": "Organization", name: "X" }, {
    "@type": "JobPosting",
    title: "Responsable logistique (h/f) &amp; achats",
    description: "&lt;p&gt;Vos missions :&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Piloter le stock&lt;/li&gt;&lt;li&gt;Gérer l&#39;équipe&lt;/li&gt;&lt;/ul&gt;&lt;script&gt;alert(1)&lt;/script&gt;",
    employmentType: ["FULL_TIME"],
    jobLocationType: "TELECOMMUTE",
    jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "Genève" } },
  }],
})}</script></head><body><nav>Menu du site</nav></body></html>`;

describe("import d'une offre depuis son lien", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(lookup).mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as never);
  });

  it("reprend l'offre et rien d'autre de la page", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(page(AVEC_OFFRE));
    const r = await importerOffreDepuisLien("https://www.entreprise.ch/jobs/123");
    expect(r.erreur).toBeUndefined();
    expect(r.offre?.title).toBe("Responsable logistique (h/f) & achats");
    expect(r.offre?.location).toBe("Genève");
    expect(r.offre?.work_mode).toBe("Télétravail");
    expect(r.offre?.contract_type).toBeNull(); // FULL_TIME : CDI ou CDD, on ne devine pas
    expect(r.offre?.description).toContain("• Piloter le stock");
    expect(r.offre?.description).toContain("Gérer l'équipe");
    expect(r.offre?.description).not.toContain("alert");
    expect(r.offre?.description).not.toContain("Menu du site");
    expect(r.offre?.apply_url).toBe("https://www.entreprise.ch/jobs/123");
  });

  it("dit clairement quand la page n'a pas de données lisibles", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(page("<html><body><h1>Poste</h1></body></html>"));
    const r = await importerOffreDepuisLien("https://www.entreprise.ch/jobs/123");
    expect(r.offre).toBeUndefined();
    expect(r.erreur).toMatch(/ne peut pas être importée automatiquement/);
  });

  it("refuse une adresse interne", async () => {
    const f = vi.spyOn(globalThis, "fetch");
    vi.mocked(lookup).mockResolvedValue([{ address: "10.0.0.5", family: 4 }] as never);
    expect((await importerOffreDepuisLien("https://intranet.entreprise.ch/x")).erreur).toBeTruthy();
    for (const u of ["http://127.0.0.1/", "http://169.254.169.254/latest/meta-data", "http://localhost:3000", "http://[::1]/", "ftp://exemple.ch/x", "https://exemple.ch:8443/x"]) {
      expect((await importerOffreDepuisLien(u)).erreur, u).toBeTruthy();
    }
    expect(f).not.toHaveBeenCalled();
  });

  it("refuse une redirection vers une adresse interne", async () => {
    vi.mocked(lookup).mockImplementation((async (h: string) =>
      h === "piege.ch" ? [{ address: "93.184.216.34", family: 4 }] : [{ address: "192.168.1.1", family: 4 }]) as never);
    const f = vi.spyOn(globalThis, "fetch").mockResolvedValue(page("", 302, { location: "http://routeur.local.ch/admin" }));
    const r = await importerOffreDepuisLien("https://piege.ch/offre");
    expect(r.erreur).toBeTruthy();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("lit aussi le format microdata, et seulement le bloc de l'offre", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(page(
      `<nav>Menu</nav><div itemscope itemtype="http://schema.org/JobPosting"><h1 itemprop="title">Monteur <b>(h/f)</b></h1>`
      + `<span itemprop="jobLocation"><span itemprop="addressLocality">Fribourg</span></span>`
      + `<div itemprop="description"><div><p>Missions</p><div>Montage</div></div></div></div><footer>Pied</footer>`));
    const r = await importerOffreDepuisLien("https://job.exemple.ch/job/1");
    expect(r.offre?.title).toBe("Monteur (h/f)");
    expect(r.offre?.location).toBe("Fribourg");
    expect(r.offre?.description).toBe("Missions\n\nMontage");
  });

  it("signale une offre disparue", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(page("", 404));
    expect((await importerOffreDepuisLien("https://www.entreprise.ch/jobs/1")).erreur).toMatch(/n'existe plus/);
  });
});

describe("nettoyage du texte d'une offre", () => {
  it("garde paragraphes et listes, retire tout le code", () => {
    const t = htmlVersTexte("<h2>Profil</h2><p>Vous avez&nbsp;5 ans</p><ul><li>Rigueur</li><li>Allemand</li></ul><style>.x{}</style>");
    expect(t).toBe("Profil\n\nVous avez 5 ans\n\n• Rigueur\n• Allemand");
  });
});
