import { describe, it, expect } from "vitest";
import { langueOffre } from "@/lib/offres";

describe("langueOffre", () => {
  it.each([
    ["Avocat(e) à 100% ou 80%", "Vous serez rattaché(e) à notre département judiciaire", "fr"],
    ["Anwaltspraktikum", "Während eines Praktikums am Standort Bern erhalten Sie einen Einblick", "de"],
    ["Senior Startup & Venture Capital Lawyer (80%-100%)", null, "en"],
    ["Office Manager:in (80-100%)", "Sie schaffen Möglichkeiten, Sie können Multitasking, Sie mögen Menschen", "de"],
    ["Substitut/-in Banking, Finance & Fintech und Kapitalmarktrecht", "Sie sind in den Bereichen Banking tätig und unterstützen uns", "de"],
    ["Collaboratore amministrativo", "Siamo alla ricerca di una persona con esperienza per il nostro ufficio", "it"],
    ["Senior Fullstack Java Developer 100% (f/m/d)", "Develop and maintain Java-based solutions for the regulatory reporting platforms", "en"],
  ])("%s", (titre, texte, attendu) => {
    expect(langueOffre(titre, texte)).toBe(attendu);
  });
});
