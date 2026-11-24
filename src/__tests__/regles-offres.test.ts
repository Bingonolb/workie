// Règles des offres synchronisées, sur des cas réels rencontrés.
// Modèle validé par Luc : Kellerhals Carrard (2026-11-21).
import { describe, it, expect } from "vitest";
import { titrePropre, resume, taux, contrat, lieuPropre, lieuEnSuisse, entites, phrasesCommunes, CANDIDATURE_SPONTANEE, SUISSE } from "../lib/synchroOffres/regles.mjs";

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
    expect(contrat("Verkäufer:in", "Unbefristet")).toBe("CDI");
    expect(contrat("Engineer", "Unlimited")).toBe("CDI");
    expect(contrat("Engineer", "Permanent contract")).toBe("CDI");
    expect(contrat("Assistant", "Befristet")).toBe("CDD");
    expect(contrat("Analyst", "Fixed-term")).toBe("CDD");
    expect(titrePropre("Project Leader R&amp;amp;D")).toBe("Project Leader R&D");
    expect(titrePropre("Door Attendant 100% (w/m/i)")).toBe("Door Attendant 100%");
    expect(titrePropre("(Senior) Account Executive Health & Benefits (f/m/d, 80-100%)")).toBe("(Senior) Account Executive Health & Benefits (80-100%)");
    expect(titrePropre("Tecnico elettronico turnista (m/f/ - 100%)")).toBe("Tecnico elettronico turnista (100%)");
    expect(titrePropre("Technicien(ne) de laboratoire (H/F/N)")).toBe("Technicien(ne) de laboratoire");
    expect(titrePropre("Technicienne de chantier â Second Åuvre (d) 100%")).toBe("Technicienne de chantier – Second Œuvre (d) 100%");
    expect(titrePropre("AI Architect - BCG Platinion Zurich, Switzerland")).toBe("AI Architect - BCG Platinion");
    expect(titrePropre("Consultant, Switzerland")).toBe("Consultant");
    expect(titrePropre("Chef de projet Tunnel (h/f/) 80-100 %")).toBe("Chef de projet Tunnel 80-100 %");
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
    expect(lieuPropre("Salinenstrasse 70", "Bâle")).toBe("Bâle");
    expect(lieuPropre("Luzern Bahnhofshopping")).toBe("Lucerne");
    expect(lieuPropre("Volketswil Volkiland")).toBe("Volketswil");
    expect(lieuPropre("Root D4")).toBe("Root");
    expect(lieuPropre("Lugano e home")).toBe("Lugano");
    expect(lieuPropre("Le Grand-Saconnex")).toBe("Le Grand-Saconnex");
    expect(lieuPropre("Sankt Niklaus")).toBe("Sankt Niklaus");
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

describe("intertitres isolés", () => {
  it("« Introduction » et « Responsabilités » ne font pas partie de l'aperçu", () => {
    const html = "<p>Introduction</p><p>Pour le groupe Masses MP, nous recherchons un responsable de groupe qui encadre une équipe de production.</p><p>Responsabilités</p><ul><li>Encadrer l'équipe</li></ul>";
    expect(resume(html, "Rolex", "Responsable de groupe")).toBe("Pour le groupe Masses MP, nous recherchons un responsable de groupe qui encadre une équipe de production.");
  });
});

describe("BCV", () => {
  it("saute l'accroche en question et l'invitation", () => {
    const html = "<p>Et si votre histoire professionnelle se poursuivait à la BCV ?</p><p>Mettez vos ambitions managériales au service d’une performance saine en rejoignant la première banque du canton.</p><p>Vos missions principales:</p><ul><li>piloter le portefeuille de projets du domaine</li><li>conduire une équipe d’une quinzaine de collaborateurs</li></ul>";
    expect(resume(html, "Banque Cantonale Vaudoise (BCV)", "Responsable")).toBe("Piloter le portefeuille de projets du domaine. Conduire une équipe d’une quinzaine de collaborateurs.");
  });
});

describe("Umantis : propreté (cas réels)", () => {
  it("décode toutes les lettres accentuées", () => {
    expect(entites("État de Neuch&acirc;tel, Z&uuml;rich, Gen&egrave;ve, fran&ccedil;ais, &Eacute;cole, c&oelig;ur")).toBe("État de Neuchâtel, Zürich, Genève, français, École, cœur");
  });
  it("lieux", () => {
    expect(lieuPropre("--> Consultant", "Zurich")).toBe("Zurich");
    expect(lieuPropre("Hauptsitz Chur")).toBe("Coire");
    expect(lieuPropre("Region Arosa")).toBe("Arosa");
    expect(lieuPropre("Rüfenacht b. Bern")).toBe("Rüfenacht");
    expect(lieuPropre("Central", "Zoug")).toBe("Zoug");
    expect(lieuPropre("Zug")).toBe("Zoug");
    expect(lieuPropre("St. Moritz, Graubünden")).toBe("Saint-Moritz");
  });
  it("aperçus : ni en-tête, ni présentation, ni titre répété", () => {
    expect(resume("<p>Graubündner Kantonalbank | online seit: 16.04.2026</p><p>Du leitest Projekte im Bereich Digitalisierung und koordinierst die Teams.</p>", "Banque cantonale des Grisons (GKB)", "Senior Projektleiter:in")).toMatch(/^Du leitest/);
    expect(resume("<p>Arbeitsort: Zürich - Rehalp</p><p>Du führst ein Team von Umweltfachleuten und begleitest Bauprojekte.</p>", "Basler & Hofmann", "Teamleiter:in")).toMatch(/^Du führst/);
    expect(resume("<p>Als eines der vier Häuser der The Tschuggen Collection bietet unser Haus 128 Zimmer.</p><p>Du betreust die Reservationen und optimierst die Belegung des Hotels.</p>", "Tschuggen Grand Hotel", "Reservation Manager")).toMatch(/^Du betreust/);
    expect(resume("<p>Werde Teil von etwas Grösserem – werde Teil der Schweizer Paraplegiker Gruppe.</p><p>Du begleitest Patientinnen und Patienten im Alltag und unterstützt das Pflegeteam.</p>", "Paraplegiker-Zentrum Nottwil", "Assistent*in")).toMatch(/^Du begleitest/);
    expect(resume("<p>Senior IT/OT Systems Engineer (w/m/d) 80% - 100% Du möchtest die Zukunft einer modernen Produktion mitgestalten.</p>", "CMSA", "Senior IT/OT Systems Engineer 80% - 100%")).toMatch(/^Du möchtest/);
    expect(resume("<p>Lust, dich weiterzuentwickeln? Bei uns findest du ein dynamisches Umfeld.</p><p>Du bearbeitest Dienstbarkeiten und berätst interne Stellen in Rechtsfragen.</p>", "Energie 360°", "Paralegal")).toMatch(/^Du bearbeitest/);
  });
});

describe("magasins, titres sur deux lignes, coopératives (cas réels)", () => {
  it("lieux de magasins", () => {
    expect(lieuPropre("Aarau City Restaurant")).toBe("Aarau");
    expect(lieuPropre("Bern Bahnhof to go")).toBe("Berne");
    expect(lieuPropre("Basel City Pfauen Restaurant")).toBe("Bâle");
    expect(lieuPropre("Bellinzona Nord")).toBe("Bellinzona");
    expect(lieuPropre("Basel Aeschenplatz")).toBe("Bâle");
    expect(lieuPropre("Bahnhof", "Bâle")).toBe("Bâle");
    expect(lieuPropre("Aussendienst Schweiz")).toBe("Service externe");
    expect(lieuPropre("La Chaux-de-Fonds")).toBe("La Chaux-de-Fonds");
    expect(lieuPropre("Le Grand-Saconnex")).toBe("Le Grand-Saconnex");
  });
  it("titres", () => {
    expect(titrePropre("Verantwortlicher Gesamtleistungen<br/>für die Region Südschweiz")).toBe("Verantwortlicher Gesamtleistungen für die Region Südschweiz");
    expect(titrePropre("Laborant:in,<br/>vor- und nachgeburtliche genetische Diagnostik,")).toBe("Laborant:in, vor- und nachgeburtliche genetische Diagnostik");
  });
  it("coopérative qui se présente, espace avant virgule", () => {
    expect(resume("<p>Die LANDI Genossenschaften unterstützen die Schweizer Bäuerinnen und Bauern.</p><p>Du berätst unsere Kundschaft im TopShop und bedienst die Kasse.</p>", "fenaco", "Verkaufsmitarbeiter/in")).toMatch(/^Du berätst/);
    expect(resume("<p>Nous recherchons un responsable (H/F) , prêt à suivre l'activité du site de Bulle .</p>", "Rolex", "Responsable")).toBe("Nous recherchons un responsable (H/F), prêt à suivre l'activité du site de Bulle.");
  });
});

describe("derniers lieux de magasins", () => {
  it.each([
    ["Neueröffnung Andermatt Reuss", "Andermatt"], ["Schafisheim Personalrestaurant", "Schafisheim"],
    ["Losone Ipermercato Cattori", "Losone"], ["Coop City Fusterie", "Coop City Fusterie"], ["VZ Castione", "Castione"],
    ["Ginebra", "Genève"], ["Wintethur Stadtgarten", "Winterthur"], ["Kölliken", "Kölliken"],
  ])("%s", (brut, attendu) => expect(lieuPropre(brut, attendu === "Coop City Fusterie" ? "Genève" : undefined)).toBe(attendu === "Coop City Fusterie" ? "Genève" : attendu));
  it("hôtel", () => expect(lieuPropre("Hotel Pullman", "Bâle")).toBe("Bâle"));
});

describe("Refline : présentations (cas réels)", () => {
  it.each([
    ["Institut fédéral de recherches WSL", "<p>The Swiss Federal Institute for Forest, Snow and Landscape Research WSL is part of the ETH Domain.</p><p>You develop automated methods for biodiversity monitoring with camera traps.</p>", /^You develop/],
    ["Hiestand", "<p>Wir vereinen Leidenschaft für einzigartige Backwaren mit Pioniergeist.</p><p>Du betreust Gastronomiekunden im Kanton Graubünden und baust das Geschäft aus.</p>", /^Du betreust/],
    ["Burckhardt Immobilien", "<p>Wir setzen uns für überzeugende Architektur ein.</p><p>Du unterstützt das Projektteam bei Entwürfen und Plänen.</p>", /^Du unterstützt/],
  ])("%s", (e, html, attendu) => expect(resume(html, e, "Poste")).toMatch(attendu));
});

describe("apprentissage : dit, pas deviné", () => {
  it.each([
    ["Elektroinstallateur oder Servicetechniker EFZ", undefined, null],
    ["Motorradmechaniker/in EFZ 80 - 100%", undefined, null],
    ["Installatrice ou installateur électricien·ne CFC 80-100%", undefined, null],
    ["Lehrstelle als Kauffrau:mann EFZ", undefined, "Apprentissage"],
    ["Place d'apprentissage Mécatronicien/ne d'automobiles CFC 2027", undefined, "Apprentissage"],
    ["Logistiker:in EFZ 2027", undefined, "Apprentissage"],
    ["Detailhandelsfachfrau:mann EFZ", "Festanstellung Apprentissage Vente", "Apprentissage"],
  ])("%s", (titre, indice, attendu) => expect(contrat(titre, indice)).toBe(attendu));
});

describe("stage avant apprentissage", () => {
  it("Praktikant:in rangé sous « alternance » reste un stage", () => {
    expect(contrat("Praktikant:in 60 %", "Stage / Trainee / Études en alternance Apprentissage")).toBe("Stage");
    expect(contrat("Lehrstelle Kauffrau:mann EFZ", "Stage / Trainee")).toBe("Apprentissage");
  });
});

describe("symboles nommés", () => {
  it("décode °, ·, •, ®, ², ½, tiret conditionnel", () => {
    expect(entites("360&deg;-Beratung &middot; Teamplayer &bull; Excel&reg; m&sup2; &frac12; Stelle Ab&shy;teilung")).toBe("360°-Beratung · Teamplayer • Excel® m² ½ Stelle Abteilung");
  });
});

describe("phrases communes : jamais le rôle", () => {
  const offres = [
    ["Mécatronicien", "<p>Une aide de CHF 1'500.- pour tes leçons de conduite.</p><p>Tu répares les véhicules de nos clients et poses les diagnostics.</p>"],
    ["Carrossier", "<p>Une aide de CHF 1'500.- pour tes leçons de conduite.</p><p>Tu remets en forme les carrosseries endommagées.</p>"],
    ["Peintre", "<p>Une aide de CHF 1'500.- pour tes leçons de conduite.</p><p>Tu prépares et peins les pièces de carrosserie.</p>"],
    ["Logisticien", "<p>Une aide de CHF 1'500.- pour tes leçons de conduite.</p><p>Tu réceptionnes et ranges les pièces détachées.</p>"],
    ["Vendeur A", "<p>Du berätst unsere Kundschaft im Laden.</p>"], ["Vendeur B", "<p>Du berätst unsere Kundschaft im Laden.</p>"],
    ["Vendeur C", "<p>Du berätst unsere Kundschaft im Laden.</p>"], ["Vendeur D", "<p>Du berätst unsere Kundschaft im Laden.</p>"],
  ].map(([titre, html]) => ({ titre, html }));
  const communes = phrasesCommunes(offres);
  it("écarte l'avantage répété et garde le rôle", () => {
    expect(resume(offres[0].html, "AMAG", "Mécatronicien", communes)).toBe("Tu répares les véhicules de nos clients et poses les diagnostics.");
  });
  it("garde une tâche partagée écrite pour le candidat", () => {
    expect(resume(offres[4].html, "Coop", "Vendeur A", communes)).toBe("Du berätst unsere Kundschaft im Laden.");
  });
});

describe("avantage seul en tête de ligne", () => {
  it("une aide pour les leçons de conduite n'est pas le rôle", () => {
    expect(resume("<p>Une aide de CHF 1'500.- pour tes leçons de conduite. Tu répares les véhicules de nos clients.</p>", "AMAG", "Mécatronicien")).toBe("Tu répares les véhicules de nos clients.");
  });
});

describe("derniers cas répétés", () => {
  it.each([
    ["AMAG", "<p>Der Übernahme deiner Lehrmittelkosten.</p><p>Als Lernende:r wartest und reparierst du Fahrzeuge.</p>", /^Als Lernende/],
    ["Ramseier", "<p>In einem bodenständigen Umfeld mit flachen Hierarchien arbeiten Sie selbständig.</p><p>Sie führen die Abfüllanlage und sichern die Qualität.</p>", /^Sie führen/],
    ["Jet Aviation", "<p>Der Traum vom Fliegen fasziniert seit je her die Menschen.</p><p>Als Lernende:r baust du Flugzeugteile.</p>", /^Als Lernende/],
    ["Université de Zurich (UZH)", "<p>The University of Zurich offers a wide range of attractive positions in various fields.</p><p>You coordinate the clinical study and manage the data.</p>", /^You coordinate/],
  ])("%s", (e, html, attendu) => expect(resume(html, e, "Poste")).toMatch(attendu));
});

describe("AMAG apprentissage en français", () => {
  it("passe les avantages, prend le métier", () => {
    const html = "<ul><li>La prise en charge de vos frais de scolarité</li><li>Travailler sur les marques les plus connues</li></ul><p></p><p>En tant qu'apprenti·e mécatronicien·ne, tu entretiens et répares les véhicules de nos clients.</p>";
    expect(resume(html, "AMAG", "Place d'apprentissage Mécatronicien CFC")).toMatch(/^En tant qu'apprenti/);
  });
});

describe("Softgarden / Eberhard (cas réels)", () => {
  it("intertitre collé à la liste, citation du chef", () => {
    const html = "<p><strong>Über uns</strong></p><p>Tauche ein in die Welt der Pioniere. Als Familienunternehmen setzen wir neue Massstäbe.</p><p>Das sagt Daniel Eberhard, Leiter Bau zur Stelle: \"Bauen ist deine Leidenschaft?\"</p><p><strong>Deine Aufgaben</strong><ul><li>Du betreust deine Bauprojekte von der Akquisition bis zur Bauabnahme</li><li>Du führst deine Poliere</li></ul></p>";
    expect(resume(html, "Eberhard Bau", "Bauführer")).toBe("Du betreust deine Bauprojekte von der Akquisition bis zur Bauabnahme. Du führst deine Poliere.");
  });
  it("raison sociale en fin de titre", () => {
    expect(titrePropre("Bauführer Wasser- und Erdbau 80-100% (w/m/d) - Eberhard Bau AG")).toBe("Bauführer Wasser- und Erdbau 80-100%");
    expect(titrePropre("Chef de projet senior sites contaminés 80-100% - Ebiox AG")).toBe("Chef de projet senior sites contaminés 80-100%");
  });
});

describe("háček, citation entière, « Das erwartet dich »", () => {
  it("&Scaron;KODA", () => expect(entites("&Scaron;KODA &ccaron;")).toBe("ŠKODA č"));
  it("citation sur toute sa ligne, puis la rubrique", () => {
    const html = "<p>Das sagt Daniel Eberhard, Leiter Bau zur Stelle: \"Bauen ist deine Leidenschaft? Für dich sind Nachhaltigkeit und Kreislaufwirtschaft mehr als Schlagwörter.\"</p><p>Mit modernster Technik sorgen wir für saubere Böden.</p><h3>Das erwartet dich</h3><ul><li>Du leitest Sanierungsprojekte</li></ul>";
    expect(resume(html, "Eberhard Bau", "Projektleiter")).toBe("Du leitest Sanierungsprojekte.");
  });
});

describe("les intertitres ne sont jamais des phrases communes", () => {
  it("« Deine Aufgaben » répété dans toutes les offres reste un repère", () => {
    const offres = ["A", "B", "C", "D", "E"].map(t => ({ titre: `Poste ${t} différent`, html: `<p>Über uns</p><p>Tauche ein in die Welt der Pioniere.</p><p>Deine Aufgaben</p><ul><li>Du leitest die Baustelle ${t} und koordinierst das Team</li></ul>` }));
    const communes = phrasesCommunes(offres);
    expect(resume(offres[0].html, "Eberhard Bau", "Poste A différent", communes)).toBe("Du leitest die Baustelle A und koordinierst das Team.");
  });
});

describe("fiche technique en tête (BKB)", () => {
  it("ignore « Étiquette: » + valeur courte et les débris", () => {
    const html = "<p>Bereich/Abteilung:</p><p>Vertrieb Privatkunden/</p><p>Arbeitsort:</p><p>Basel</p><p>Stellenantritt:</p><p>01.12.2026 oder nach Vereinbarung</p><p>--></p><p>Schwarz und Wyss - unsere Lieblingsfarben seit 1899.</p><p>Ihre Aufgaben</p><ul><li>Sie beraten Privatkundinnen und -kunden am Telefon und im Chat</li></ul>";
    expect(resume(html, "Banque Cantonale de Bâle (BKB)", "Kundenberaterin Services")).toBe("Sie beraten Privatkundinnen und -kunden am Telefon und im Chat.");
  });
});

describe("BKB « Dein neuer Job », profil et avantages Volg", () => {
  it("BKB", () => {
    const html = "<p>Schwarz und Wyss - unsere Lieblingsfarben seit 1899. Schlicht. Elegant. Gradlinig.</p><p>Karin und weitere Kollegen suchen Verstärkung.</p><p>Dein neuer Job</p><ul><li>Entgegennehmen und Bearbeiten von telefonischen Kundenanfragen</li></ul><p>Davon profitieren wir</p><ul><li>Abgeschlossene kaufmännische Berufsbildung</li></ul>";
    expect(resume(html, "Banque Cantonale de Bâle (BKB)", "Kundenberaterin")).toBe("Entgegennehmen und Bearbeiten von telefonischen Kundenanfragen.");
  });
  it("Volg : profil et avantages passés", () => {
    expect(resume("<p>Familiäre Teams. Persönlicher Kundenkontakt. Digitales Lernen.</p><p>Real- oder Sekundarschulabschluss.</p><p>Du lernst, unsere Kundschaft im Dorfladen zu beraten und die Ware zu präsentieren.</p>", "Volg", "Lernende/r Detailhandel")).toMatch(/^Du lernst/);
  });
});

describe("sites maison : questions, profil, accroche", () => {
  it.each([
    ["Denner", "<p>Karriereziel Filialleiter*in? Dann haben wir das perfekte Sprungbrett für dich.</p><p>Du führst die Filiale in Abwesenheit der Leitung und planst die Einsätze.</p>", /^Dann haben wir|^Du führst/],
    ["Mandarin Oriental Genève", "<p>Are you a master of your craft? Do you thrive in a team that succeeds together?</p><p>You will supervise the evening housekeeping team and inspect the rooms.</p>", /^You will supervise/],
    ["Banque cantonale de Thurgovie (TKB)", "<p>Du hast eine gymnasiale Maturität, vorzugsweise mit Schwerpunkt Wirtschaft.</p><p>Im Bankeinstieg lernst du alle Bereiche der Bank kennen.</p>", /^Im Bankeinstieg/],
    ["Rugenbräu", "<p>Zur Erweiterung unseres Teams suchen wir für das Marktgebiet Bern eine Persönlichkeit.</p><p>Sie betreuen unsere Gastronomiekunden und gewinnen neue Kunden.</p>", /^Sie betreuen/],
  ])("%s", (e, html, attendu) => expect(resume(html, e, "Poste")).toMatch(attendu));
});
