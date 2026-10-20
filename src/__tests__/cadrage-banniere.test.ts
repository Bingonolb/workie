import { describe, it, expect } from "vitest";
import { lireCadrage, avecCadrage, largeurCouverture, CADRAGE_NEUTRE } from "@/lib/coverUrl";

/*
 * Le cadrage voyage dans l'adresse de la bannière, après un dièse. La seule
 * chose qui ne doit jamais arriver, c'est qu'il abîme l'adresse de l'image :
 * une bannière qui ne charge plus est pire qu'une bannière mal cadrée.
 */
const SUPABASE = "https://x.supabase.co/storage/v1/object/public/covers/covers/a/b.webp";
const PEXELS = "https://images.pexels.com/photos/1/pexels-photo-1.jpeg?auto=compress&cs=tinysrgb&w=1600&h=900";

describe("cadrage de la bannière", () => {
  it("une adresse sans cadrage reste neutre", () => {
    expect(lireCadrage(SUPABASE)).toEqual({ src: SUPABASE, cadrage: CADRAGE_NEUTRE });
  });

  it("aller-retour : écrire puis relire donne le même cadrage", () => {
    const url = avecCadrage(SUPABASE, { x: 30, y: 70, zoom: 1.5 });
    expect(url).toBe(`${SUPABASE}#cadrage=30,70,1.50`);
    expect(lireCadrage(url)).toEqual({ src: SUPABASE, cadrage: { x: 30, y: 70, zoom: 1.5 } });
  });

  it("un cadrage neutre n'ajoute rien à l'adresse", () => {
    expect(avecCadrage(SUPABASE, CADRAGE_NEUTRE)).toBe(SUPABASE);
  });

  it("réécrire un cadrage remplace l'ancien au lieu de s'empiler", () => {
    const une = avecCadrage(SUPABASE, { x: 10, y: 10, zoom: 1.2 });
    const deux = avecCadrage(une, { x: 80, y: 20, zoom: 2 });
    expect(deux).toBe(`${SUPABASE}#cadrage=80,20,2.00`);
  });

  it("des valeurs hors limites sont bornées", () => {
    expect(lireCadrage(`${SUPABASE}#cadrage=150,0,9`).cadrage).toEqual({ x: 100, y: 0, zoom: 2.5 });
  });

  it("un cadrage illisible retombe sur le centre, sans casser l'adresse", () => {
    expect(lireCadrage(`${SUPABASE}#cadrage=abc`)).toEqual({ src: SUPABASE, cadrage: CADRAGE_NEUTRE });
  });

  it("l'adresse de rendu Supabase ne contient jamais le dièse", () => {
    const rendu = largeurCouverture(`${SUPABASE}#cadrage=30,70,1.00`, 640);
    expect(rendu).not.toContain("#");
    expect(rendu).toContain("/render/image/public/");
    expect(rendu).toContain("width=640");
  });

  it("zoomer demande une image plus large, pour rester nette", () => {
    expect(largeurCouverture(`${SUPABASE}#cadrage=50,50,2.00`, 640)).toContain("width=1280");
    expect(largeurCouverture(`${PEXELS}#cadrage=50,50,2.00`, 640)).toContain("w=1280");
  });

  it("la largeur demandée ne dépasse jamais 2560", () => {
    expect(largeurCouverture(`${SUPABASE}#cadrage=50,50,2.50`, 1280)).toContain("width=2560");
  });
});
