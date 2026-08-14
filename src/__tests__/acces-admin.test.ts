import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendClaimApprovedEmail: vi.fn() }));
vi.mock("@/lib/actions/notifications", () => ({ notifyNewCompany: vi.fn() }));

import { createClient, getUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminUpdateCompany } from "@/lib/actions/admin";

type ClientServeur = Awaited<ReturnType<typeof createClient>>;

/** Faux client dont `profiles.role` renvoie ce qu'on lui demande. */
function clientAvecRole(role: string | null) {
  return {
    from: vi.fn(() => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: role === null ? null : { role } }) }) }),
    })),
  } as unknown as ClientServeur;
}

/**
 * Le bouton « Modifier » de la fiche entreprise et l'entrée « Admin » de la
 * barre du bas ne sont que des raccourcis : ils s'affichent d'après une valeur
 * venue du client, qui n'autorise rien. Ce qui protège réellement, c'est que
 * l'écriture relise le rôle en base.
 *
 * Si l'un de ces tests tombe, n'importe quel visiteur peut modifier n'importe
 * quelle fiche. Corriger le garde, jamais le test.
 */
describe("adminUpdateCompany refuse tout le monde sauf un administrateur", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAdminClient).mockReturnValue({} as ReturnType<typeof createAdminClient>);
  });

  it("refuse un visiteur sans session", async () => {
    vi.mocked(getUser).mockResolvedValue(null);
    vi.mocked(createClient).mockResolvedValue(clientAvecRole(null));

    const r = await adminUpdateCompany("entreprise-1", new FormData());
    expect(r.error).toBeTruthy();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuse un utilisateur connecté sans rôle particulier", async () => {
    vi.mocked(getUser).mockResolvedValue({ id: "lambda" } as NonNullable<Awaited<ReturnType<typeof getUser>>>);
    vi.mocked(createClient).mockResolvedValue(clientAvecRole("user"));

    const r = await adminUpdateCompany("entreprise-1", new FormData());
    expect(r.error).toBeTruthy();
    // Le client de service, qui contourne les politiques de sécurité, ne doit
    // même pas être construit tant que le rôle n'est pas vérifié.
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuse un profil introuvable", async () => {
    vi.mocked(getUser).mockResolvedValue({ id: "fantome" } as NonNullable<Awaited<ReturnType<typeof getUser>>>);
    vi.mocked(createClient).mockResolvedValue(clientAvecRole(null));

    const r = await adminUpdateCompany("entreprise-1", new FormData());
    expect(r.error).toBeTruthy();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("refuse un rôle voisin mais différent", async () => {
    for (const role of ["admin ", "Admin", "administrator", "business", "moderator"]) {
      vi.clearAllMocks();
      vi.mocked(createAdminClient).mockReturnValue({} as ReturnType<typeof createAdminClient>);
      vi.mocked(getUser).mockResolvedValue({ id: "presque" } as NonNullable<Awaited<ReturnType<typeof getUser>>>);
      vi.mocked(createClient).mockResolvedValue(clientAvecRole(role));

      const r = await adminUpdateCompany("entreprise-1", new FormData());
      expect(r.error, `le rôle « ${role} » ne doit pas passer`).toBeTruthy();
      expect(createAdminClient).not.toHaveBeenCalled();
    }
  });

  it("laisse passer un administrateur", async () => {
    vi.mocked(getUser).mockResolvedValue({ id: "patron" } as NonNullable<Awaited<ReturnType<typeof getUser>>>);
    vi.mocked(createClient).mockResolvedValue(clientAvecRole("admin"));

    // On ne va pas jusqu'au bout de l'écriture : le client de service est vide,
    // donc l'action échouera plus loin. Ce qui compte ici est qu'elle ait
    // franchi le contrôle de rôle, ce que prouve sa construction.
    await adminUpdateCompany("entreprise-1", new FormData());
    expect(createAdminClient).toHaveBeenCalled();
  });
});
