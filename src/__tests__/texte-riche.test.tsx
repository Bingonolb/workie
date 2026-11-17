import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { texteRiche, lignesRiches } from "@/lib/texteRiche";

const html = (n: React.ReactNode) => renderToStaticMarkup(<>{n}</>);

describe("gras et italique des offres", () => {
  it("met en gras et en italique", () => {
    expect(html(texteRiche("Un **CFC** et *idéalement* un brevet"))).toBe(
      'Un <strong style="color:var(--text);font-weight:700">CFC</strong> et <em>idéalement</em> un brevet');
  });
  it("n'injecte jamais de HTML", () => {
    const h = html(lignesRiches("<script>alert(1)</script>\n**<img src=x onerror=alert(1)>**"));
    expect(h).not.toContain("<script");
    expect(h).not.toContain("<img");
  });
  it("laisse une marque non refermée telle quelle", () => {
    expect(html(texteRiche("5 * 3 = 15"))).toBe("5 * 3 = 15");
  });
});
