import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

/**
 * Cloisonnement des comptes — protocole permanent.
 *
 * Incident du 2026-08-09 : la mémoire de session n'était vidée qu'à la
 * déconnexion explicite. En créant un compte sans rechargement complet,
 * l'utilisateur retrouvait le profil du compte précédent — un nouveau compte
 * affichait le nom de quelqu'un d'autre. Ce n'était pas un défaut d'affichage
 * mais une fuite de données entre comptes.
 *
 * Ces tests sont la garde permanente. Toute donnée personnelle mise en mémoire
 * doit franchir trois contrôles indépendants :
 *
 *   1. l'entrée porte l'identifiant du compte qui l'a écrite ;
 *   2. la réponse du serveur déclare elle-même son destinataire ;
 *   3. rien n'est lu quand aucun compte n'est identifiable.
 *
 * Si l'un de ces tests tombe, la fuite est de retour. Ne pas l'ajuster pour le
 * faire passer : corriger le cache.
 */

let cookie = "";
vi.stubGlobal("document", { get cookie() { return cookie; } });

/** Fabrique un cookie de session Supabase contenant l'identifiant voulu. */
function connecter(sub: string | null) {
  if (sub === null) { cookie = ""; return; }
  const charge = Buffer.from(JSON.stringify({ sub })).toString("base64url");
  const jeton = `entete.${charge}.signature`;
  const valeur = Buffer.from(JSON.stringify({ access_token: jeton })).toString("base64");
  cookie = `sb-projet-auth-token=base64-${valeur}`;
}

async function chargerCache() {
  vi.resetModules();
  return import("@/lib/cacheSession");
}

describe("cloisonnement des comptes", () => {
  beforeEach(() => { cookie = ""; });
  afterEach(() => { vi.restoreAllMocks(); });

  it("rend la donnée à son propriétaire", async () => {
    const { lireCache, ecrireCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-A", nom: "Alice" });
    expect(lireCache<{ nom: string }>("profil")?.nom).toBe("Alice");
  });

  it("ne rend jamais la donnée d'un autre compte", async () => {
    const { lireCache, ecrireCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-A", nom: "Alice" });
    connecter("compte-B");                    // nouveau compte, même onglet
    expect(lireCache("profil")).toBeUndefined();
  });

  it("ne rend rien quand personne n'est connecté", async () => {
    const { lireCache, ecrireCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-A", nom: "Alice" });
    connecter(null);                          // déconnexion
    expect(lireCache("profil")).toBeUndefined();
  });

  it("refuse une réponse adressée à quelqu'un d'autre, même bien rangée", async () => {
    // Second contrôle, indépendant du premier : si le marquage de l'entrée
    // était erroné, le destinataire déclaré doit encore protéger.
    const { lireCache, ecrireCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-B", nom: "Bob" });
    expect(lireCache("profil")).toBeUndefined();
  });

  it("oublie définitivement une entrée rejetée", async () => {
    const { lireCache, ecrireCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-A", nom: "Alice" });
    connecter("compte-B");
    lireCache("profil");                      // rejetée et purgée
    connecter("compte-A");                    // retour du propriétaire
    expect(lireCache("profil")).toBeUndefined(); // repart du serveur, pas de résidu
  });

  it("la déconnexion vide tout", async () => {
    const { lireCache, ecrireCache, viderCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-A", nom: "Alice" });
    ecrireCache("favoris", { compte: "compte-A", companies: [] });
    viderCache();
    expect(lireCache("profil")).toBeUndefined();
    expect(lireCache("favoris")).toBeUndefined();
  });

  it("un cookie illisible ne donne accès à rien", async () => {
    const { lireCache, ecrireCache } = await chargerCache();
    connecter("compte-A");
    ecrireCache("profil", { compte: "compte-A", nom: "Alice" });
    cookie = "sb-projet-auth-token=nimportequoi";
    expect(lireCache("profil")).toBeUndefined();
  });
});
