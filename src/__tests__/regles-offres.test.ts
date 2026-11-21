// Règles des offres synchronisées, sur des cas réels rencontrés.
// Modèle validé par Luc : Kellerhals Carrard (2026-11-21).
import { describe, it, expect } from "vitest";
import { titrePropre, resume, taux, contrat, lieuPropre, lieuEnSuisse, CANDIDATURE_SPONTANEE, SUISSE } from "../../scripts/regles-offres.mjs";

describe("titrePropre", () => {
  it.each([
    ["Praktikum - Business Unit Controlling REF297441C", "Praktikum - Business Unit Controlling"],
    ["Instandhaltung 100% (w/m/div.) - REF299587Q", "Instandhaltung 100%"],
    ["Consulting Intern Zürich (all genders) - bewirb dich jetzt bis zum 15. Januar 2027", "Consulting Intern Zürich"],
    ["Purchasing Project Buyer – Power Tools Accessories 80-100% (f/m/div). REF299496Z", "Purchasing Project Buyer – Power Tools Accessories 80-100%"],
    ["Chef de projet en gestion de la qualité 80–100 % (h/f/d) | Suisse romande", "Chef de projet en gestion de la qualité 80–100 % | Suisse romande"],
    ["ADMINISTRATIVE ASSISTANT (50-60%) - ZURICH", "Administrative assistant (50-60%) - Zurich"],
    ["SENIOR BUSINESS DEVELOPMENT &amp; MARKETING EXECUTIVE - GENEVA", "Senior business development & marketing executive - Geneva"],
    ["LAWYERS - GENEVA/ZURICH/LONDON", "Lawyers - Geneva/Zurich/London"],
    ["Office Manager:in (80-100%)", "Office Manager:in (80-100%)"],
    ["Avocat(e) à 100% ou 80%", "Avocat(e) à 100% ou 80%"],
  ])("%s", (brut, attendu) => expect(titrePropre(brut)).toBe(attendu));
});

describe("resume : le poste, jamais l'entreprise ni l'accroche", () => {
  it("saute la présentation de l'entreprise", () => {
    const html = "<p>LGT Capital Partners is a leading global specialist in alternative investing with over USD 120 billion in assets.</p><p>You will analyse secondary transactions in infrastructure and support the investment committee.</p>";
    expect(resume(html, "LGT Capital Partners")).toMatch(/^You will analyse/);
  });
  it("saute « Chez nous, … » et « Wir bieten Ihnen … »", () => {
    expect(resume("<p>Chez nous, des spécialistes partagent un objectif commun. Vous pilotez la qualité des chantiers.</p>", "Wüest Partner")).toBe("Vous pilotez la qualité des chantiers.");
    expect(resume("<p>Wir bieten Ihnen eine Perspektive. Sie sind im Bereich Banking tätig.</p>", "Kellerhals Carrard")).toBe("Sie sind im Bereich Banking tätig.");
  });
  it("prend la rubrique des tâches quand elle existe", () => {
    const html = "<p>Kellerhals Carrard est l’une des études d’avocats les plus importantes de Suisse.</p><h3>Vos tâches</h3><p>Vous serez rattaché(e) à notre département judiciaire.</p>";
    expect(resume(html, "Kellerhals Carrard")).toBe("Vous serez rattaché(e) à notre département judiciaire.");
  });
  it("ponctue les listes et décode les caractères", () => {
    expect(resume("<ul><li>Bei Neuanläufen unterstützt du</li><li>Du entwickelst Prozesse</li></ul>", "Bosch")).toBe("Bei Neuanläufen unterstützt du. Du entwickelst Prozesse.");
    expect(resume("<p>Vous traitez les demandes des clients&#xa0;: comptes, cartes et paiements.</p>", "Swissquote")).toBe("Vous traitez les demandes des clients : comptes, cartes et paiements.");
  });
});

describe("taux, contrat, filtres", () => {
  it("taux", () => {
    expect(taux("Avocat(e) à 100% ou 80%")).toEqual([80, 100]);
    expect(taux("Office Manager:in (80-100%)")).toEqual([80, 100]);
    expect(taux("Projektleiter")).toEqual([null, null]);
  });
  it("contrat", () => {
    expect(contrat("Legal Trainee - Temporary")).toBe("Stage");
    expect(contrat("Working Student Position – Master Data")).toBe("Temporaire");
    expect(contrat("Lehrstelle Polymechaniker 2027")).toBe("Apprentissage");
    expect(contrat("Sales Support Executive - 6 months contract")).toBe("CDD");
  });
  it("écarte candidatures spontanées et événements", () => {
    for (const t of ["Initiativbewerbung", "Wildcard Bewerbung", "Case Workshop - Consulting Club x Roland Berger", "Brown Bag Lunch: Finance Club meets Roland Berger"]) expect(CANDIDATURE_SPONTANEE.test(t)).toBe(true);
    for (const t of ["Consulting Intern Zürich", "(Junior) Consultant"]) expect(CANDIDATURE_SPONTANEE.test(t)).toBe(false);
  });
  it("reconnaît la Suisse sans faux amis", () => {
    for (const l of ["Zürich", "Geneva, Switzerland", "Bern", "Pfäffikon SZ, CH"]) expect(SUISSE.test(l)).toBe(true);
    for (const l of ["Bernalillo, NM", "Wilmington", "Freiburg im Breisgau", "London"]) expect(SUISSE.test(l)).toBe(false);
  });
});

describe("titres longs de Workday", () => {
  it("retire la parenthèse de conditions, garde le contrat", () => {
    const brut = "Senior Fullstack Java Developer - Regulatory Reporting Platforms 100% (f/m/d) - (Contract through our external payroll partner with immediate start for 6 months, possible extension)";
    expect(titrePropre(brut)).toBe("Senior Fullstack Java Developer - Regulatory Reporting Platforms 100%");
    expect(contrat(brut)).toBe("CDD");
  });
});

describe("propreté au niveau Kellerhals (cas réels Workday)", () => {
  it("titres", () => {
    expect(titrePropre("R&D Senior Hardware Engineer (80 - 100%) f/m/d")).toBe("R&D Senior Hardware Engineer (80 - 100%)");
    expect(titrePropre("Intern – DCFO P&BS 100% - [Fixed-Term Contract of 5-6 months / Julius Baer’s Intern Programme]")).toBe("Intern – DCFO P&BS 100%");
    expect(titrePropre("Apprentissage d'employé(e) de commerce - Switzerland")).toBe("Apprentissage d'employé(e) de commerce");
  });
  it("lieux", () => {
    expect(lieuPropre("CHE-Zurich-Zurich")).toBe("Zurich");
    expect(lieuPropre("Genève/ Rue du Rhône 31")).toBe("Genève");
    expect(lieuPropre("Solothurn/Zuchwil")).toBe("Solothurn/Zuchwil");
    expect(lieuPropre("Remote")).toBe("Télétravail");
    expect(lieuPropre("8755 Ennenda")).toBe("Ennenda");
    expect(lieuPropre("Bern oder Neuenburg sowie Home")).toBe("Berne");
    expect(lieuPropre("Reichenburg SZ und Uznach SG")).toBe("Reichenburg");
    expect(lieuPropre("Wetzikon ZH")).toBe("Wetzikon");
    expect(lieuPropre("Paketzentrum Frauenfeld")).toBe("Frauenfeld");
    expect(lieuPropre("CH", "Bâle")).toBeNull();
    expect(lieuPropre("Bern, Canton de Berne, Switzerland")).toBe("Berne");
    expect(lieuPropre("Zürich / Genferstrasse 27")).toBe("Zurich");
    expect(lieuPropre("Zurich - Lowenstrasse")).toBe("Zurich");
    expect(lieuPropre("GENEVA BUSINESS CENTER")).toBe("Genève");
    expect(lieuPropre("Geneva (GVA)")).toBe("Genève");
    expect(lieuPropre("CWR", "Genève")).toBe("Genève");
    expect(lieuPropre(null, "Zurich")).toBe("Zurich");
    expect(lieuPropre("Brüttisellen")).toBe("Brüttisellen");
  });
  it("aperçus : ni présentation, ni accroche, ni vide", () => {
    expect(resume("<p>Weleda stands at the forefront as the global leader in natural cosmetics.</p><p>You partner with managers on all HR topics and lead the recruiting process for the site.</p>", "Weleda")).toMatch(/^You partner/);
    expect(resume("<p>Sulzer est une entreprise d'ingénierie de premier plan. Vous assurez le support informatique des utilisateurs du site de Winterthur.</p>", "Sulzer")).toMatch(/^Vous assurez/);
    expect(resume("<p>Faire carrière chez Lombard Odier, c'est travailler pour un gestionnaire de fortune.</p><p>Vous gérez les services généraux du bureau de Zurich et coordonnez les prestataires.</p>", "Lombard Odier")).toMatch(/^Vous gérez/);
    expect(resume("<p>Über uns Wir verzaubern die Welt mit Schokolade! Die Lindt & Sprüngli AG ist eine Tochter.</p><p>Du berätst unsere Kundinnen und Kunden im Shop in Zermatt und sorgst für ein schönes Einkaufserlebnis.</p>", "Lindt & Sprüngli")).toMatch(/^Du berätst/);
    expect(resume("<p>Kick-start your career with our Intern Programme! You support the CFO office in reporting and planning tasks.</p>", "Julius Baer")).toMatch(/^You support/);
    expect(resume("<p>Vitol is seeking an Endpoint Security Engineer to join its Technology department and protect all endpoints.</p>", "Vitol")).toMatch(/^Vitol is seeking/);
    expect(resume("<p>Job Location</p>", "Procter & Gamble")).toBeNull();
    expect(resume("<p>Risk Officer - Derivatives</p>", "Centalion", "Risk Officer - Derivatives")).toBeNull();
    expect(resume("<p>Deadline for Applications November 23, 2026</p><p>Grade</p>", "ONU")).toBeNull();
  });
});

describe("lieux structurés SuccessFactors", () => {
  it.each([
    ["Lausanne, CH", true], ["Zürich, CH, 8152", true], ["Lugano, TI", true], ["Bern, BE, CH", true],
    ["Fribourg, FR", true], ["Brussels, BE", false], ["Singapore, SG", false],
    ["Diegem, BE, 1831", false], ["Berlin, BE, DE, 10117", false], ["CABA, B, AR, 1001", false], ["Tbilisi, GE", false], ["Zurich, CH, 8005", true], ["CH", true],
    ["Basadingen, TG", false], ["Sion, VS", true],
    ["Neuenstadt am Kocher, BW, DE", false], ["Amsterdam, NL", false], ["Madrid, ES", false], ["Paris, FR, 75001", false],
  ])("%s", (l, attendu) => expect(lieuEnSuisse(l)).toBe(attendu));
});

describe("entreprise présente seulement en Suisse", () => {
  it("accepte tous les codes de canton", () => {
    expect(lieuEnSuisse("Basadingen, TG", { cantons: true })).toBe(true);
    expect(lieuEnSuisse("Neuenstadt am Kocher, BW, DE", { cantons: true })).toBe(false);
  });
});

describe("SuccessFactors : débris en tête d'annonce (cas réels)", () => {
  it("titre avec lieu collé", () => {
    expect(titrePropre("Identity Specialist (Open-Source Technologies) (Geneva (GVA), CH, 33999)")).toBe("Identity Specialist (Open-Source Technologies)");
  });
  it.each([
    ["Feldschlösschen", "Agency Account & Project Lead", "<p>Agency Account & Project Lead (m/w/d) Ab sofort | Pensum: 80% - 100% | unbefristet | Marketing</p><p>Du entwickelst Kampagnen mit unseren Agenturen und steuerst die Budgets der Marken.</p>", /^Du entwickelst/],
    ["Zurich Insurance", "Spezialist Kundensupport", "<p>138104 | 80 - 100% | Oerlikon, Zürich | Hybrid</p><p>Du berätst unsere Kundinnen und Kunden am Telefon zu ihren Lebensversicherungen.</p>", /^Du berätst/],
    ["Rolex", "Technicien de maintenance", "<p>Introduction Pour notre division Achats, nous recherchons un technicien qui assure la maintenance des installations.</p>", /^Pour notre division/],
    ["Atos", "Java Engineer", "<p>Mit ca. 63.000 Mitarbeitenden agiert das Unternehmen in 61 Ländern.</p><p>Sie entwickeln Webanwendungen in Java für unsere Kunden aus der Finanzbranche.</p>", /^Sie entwickeln/],
    ["Jet Aviation", "Apprentice", "<p>Since 1967, Jet Aviation has been crafting flight in its smoothest form.</p><p>Als Lernende:r baust du Anlagen und Apparate aus Blech und lernst schweissen.</p>", /^Als Lernende/],
    ["Poste Suisse", "EngOps Engineer", "<p>Christian Sturm People & Transformation Lead</p><p>Du betreibst und automatisierst unsere Windows-Arbeitsplätze für 30 000 Mitarbeitende.</p>", /^Du betreibst/],
    ["Bilfinger", "Sales Manager", "<p>Bilfinger is the No. 1 for its customers in enhancing efficiency. You develop the pharma business in Switzerland and lead key accounts.</p>", /^You develop/],
    ["OIT", "Directeur", "<p>No. du poste: DC/ISSA/D/2026/01 Date de clôture: 2 janvier 2026</p><p>Vous dirigez la branche Développement de la sécurité sociale et son équipe.</p>", /^Vous dirigez/],
  ])("%s", (entreprise, titre, html, attendu) => expect(resume(html, entreprise, titre)).toMatch(attendu));
});

describe("titres : marque et villes en trop", () => {
  it.each([
    ["[Universal Genève] - Client Advisor - Geneva Flagship", "Client Advisor - Geneva Flagship"],
    ["[Universal Genève] Senior Social Media Manager", "Senior Social Media Manager"],
    ["Manager - Tax Services - Indirect Tax/VAT (Zurich, Bern oder Basel)", "Manager - Tax Services - Indirect Tax/VAT"],
    ["Identity Specialist (Open-Source Technologies)", "Identity Specialist (Open-Source Technologies)"],
  ])("%s", (brut, attendu) => expect(titrePropre(brut)).toBe(attendu));
  it("Weleda : présentation des produits écartée", () => {
    expect(resume("<p>Our holistic offerings are designed to enhance individual health.</p><p>You advise managers on all HR topics for the Arlesheim site.</p>", "Weleda")).toMatch(/^You advise/);
  });
});
