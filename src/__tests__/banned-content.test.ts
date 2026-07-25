import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    from: vi.fn(),
    rpc: vi.fn(async () => ({ error: null })),
  })),
}));

// Admin client — infinite chainable mock, returns safe defaults at every terminator
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => infiniteChain()),
  })),
}));

// Builds a proxy that returns itself for any method call, and resolves
// to safe defaults when awaited or when a Supabase terminator is called.
function infiniteChain(overrides: Record<string, unknown> = {}): unknown {
  const terminators: Record<string, () => Promise<unknown>> = {
    maybeSingle: async () => ({ data: null, error: null }),
    single:      async () => ({ data: null, error: null }),
    // isIpAbuse: count=0 → no abuse
    then: undefined as unknown as () => Promise<unknown>,
  };
  const proxy: Record<string, unknown> = new Proxy({}, {
    get(_t, prop: string) {
      if (prop in overrides) return overrides[prop];
      if (prop === "then") return undefined; // not a Promise itself
      if (prop === "maybeSingle") return terminators.maybeSingle;
      if (prop === "single") return terminators.single;
      // count-based queries (isIpAbuse, findSimilarReview)
      if (prop === "gte" || prop === "lt" || prop === "lte" || prop === "gt") {
        return () => Promise.resolve({ data: [], count: 0, error: null });
      }
      // Any other method returns the same proxy (continues the chain)
      return () => proxy;
    },
  });
  return proxy;
}

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => "127.0.0.1" })),
}));

import { submitReview } from "@/lib/actions/reviews";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fd(fields: Record<string, string>): FormData {
  const f = new FormData();
  Object.entries(fields).forEach(([k, v]) => f.append(k, v));
  return f;
}

function chain(result: unknown) {
  const b: Record<string, unknown> = {};
  const self = () => b;
  ["select","eq","not","ilike","order","limit","neq","in"].forEach(m => { b[m] = self; });
  b["maybeSingle"] = async () => result;
  b["insert"] = async () => ({ error: null });
  return b;
}

const verifiedUser = {
  id: "user-1",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

const BASE_FIELDS = {
  company_id: "company-uuid",
  rating_overall: "4",
  title: "Mon avis",
  pros: "Bonne ambiance et collègues sympa",
  cons: "Salaire un peu bas pour la région",
  job_title: "Développeur",
  duration_range: "1-3 ans",
  employment_type: "cdi",
  work_mode: "hybride",
  would_recommend: "oui",
};

async function submitWith(content: string, extra?: Record<string, string>) {
  const { createClient } = await import("@/lib/supabase/server");
  vi.mocked(createClient).mockResolvedValueOnce({
    auth: { getUser: async () => ({ data: { user: verifiedUser } }) },
    from: vi.fn((table: string) => {
      if (table === "profiles") return chain({ data: { claimed_company_id: null } });
      if (table === "companies") return chain({ data: { id: "company-uuid" } });
      if (table === "reviews") return chain({ data: null }); // no existing review
      return chain({ data: [] });
    }),
    rpc: vi.fn(async () => ({ data: [], error: null })),
  } as any);
  return submitReview(undefined, fd({ ...BASE_FIELDS, content, ...extra }));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Banned content — personal name attacks (famille 1)", () => {
  it("blocks 'Monsieur Dupont est un' pattern", async () => {
    const result = await submitWith("Monsieur Dupont est un incompétent notoire dans cette boîte depuis des années.");
    expect(result?.error).toMatch(/attaque personnelle/i);
  });

  it("blocks 'Mme. Martin est vraiment' pattern", async () => {
    const result = await submitWith("Mme. Martin est vraiment une mauvaise gestionnaire qui détruit les équipes.");
    expect(result?.error).toMatch(/attaque personnelle/i);
  });

  it("allows generic feedback without naming individuals", async () => {
    const result = await submitWith("Le management est parfois difficile mais l'ambiance est bonne dans l'ensemble.");
    expect(result?.error).toBeUndefined();
  });
});

describe("Banned content — insultes et slurs (famille 2)", () => {
  it("blocks 'connard' in content", async () => {
    const result = await submitWith("Mon chef est un vrai connard qui humilie les employés en réunion.");
    expect(result?.error).toMatch(/insultes/i);
  });

  it("blocks 'salope' in content", async () => {
    const result = await submitWith("La DRH est une salope qui licencie sans raison valable.");
    expect(result?.error).toMatch(/insultes/i);
  });

  it("blocks slur in pros field", async () => {
    const result = await submitWith(
      "Bonne entreprise avec de bons avantages et des collègues investis dans leur travail.",
      { pros: "Mon manager est un enculé de première." }
    );
    expect(result?.error).toMatch(/insultes/i);
  });

  it("allows strong but clean critique", async () => {
    const result = await submitWith(
      "La direction est incompétente et prend de mauvaises décisions stratégiques depuis des années."
    );
    expect(result?.error).toBeUndefined();
  });
});

describe("Banned content — discrimination (famille 3)", () => {
  it("blocks discrimination + company mention", async () => {
    const result = await submitWith(
      "Cette entreprise est clairement raciste dans ses pratiques de recrutement, j'en ai été victime."
    );
    expect(result?.error).toMatch(/discrimination/i);
  });

  it("blocks sexisme + entreprise", async () => {
    const result = await submitWith(
      "L'entreprise est sexiste, les femmes n'avancent jamais ici contrairement aux hommes."
    );
    expect(result?.error).toMatch(/discrimination/i);
  });

  it("allows reporting discrimination without labeling company", async () => {
    const result = await submitWith(
      "J'ai observé des comportements inégalitaires entre collègues qui n'ont pas été traités par le management."
    );
    expect(result?.error).toBeUndefined();
  });
});

describe("Banned content — menaces directes (famille 4)", () => {
  it("blocks 'je vais te tuer'", async () => {
    const result = await submitWith(
      "Mon ancien manager est nul, je vais te tuer si tu continues comme ça."
    );
    expect(result?.error).toMatch(/menace/i);
  });

  it("blocks 'on va vous détruire'", async () => {
    const result = await submitWith(
      "Cette boîte nous a arnaqués, on va vous détruire sur les réseaux sociaux."
    );
    expect(result?.error).toMatch(/menace/i);
  });

  it("allows strong frustration without threat", async () => {
    const result = await submitWith(
      "Je suis en colère contre cette entreprise qui m'a licencié sans raison valable après 5 ans de loyaux services."
    );
    expect(result?.error).toBeUndefined();
  });
});

describe("Banned content — doxxing / numéros de téléphone (famille 5)", () => {
  it("blocks Swiss phone number 07X XX XX XX", async () => {
    const result = await submitWith(
      "Pour plaindre, appelez le directeur au 079 123 45 67, il mérite d'être harcelé."
    );
    expect(result?.error).toMatch(/téléphone/i);
  });

  it("blocks phone without spaces", async () => {
    const result = await submitWith(
      "Contactez-le directement au 0791234567 pour lui dire ce que vous pensez."
    );
    expect(result?.error).toMatch(/téléphone/i);
  });

  it("blocks phone in cons field", async () => {
    const result = await submitWith(
      "Bonne ambiance dans cette société avec des collègues très professionnels et motivés.",
      { cons: "Appelez le 079 987 65 43 pour en savoir plus sur les conditions." }
    );
    expect(result?.error).toMatch(/téléphone/i);
  });

  it("allows revenue or year numbers that look similar but aren't phones", async () => {
    const result = await submitWith(
      "L'entreprise a réalisé un chiffre d'affaires de 120 millions en 2024 malgré la crise."
    );
    expect(result?.error).toBeUndefined();
  });
});

describe("Banned content — edge cases", () => {
  it("detects ban in pros field even with clean content and cons", async () => {
    const result = await submitWith(
      "Bonne ambiance dans cette société avec des avantages corrects et un bon équilibre travail vie.",
      {
        pros: "Mon responsable est un connard mais les locaux sont sympas.",
        cons: "Salaires sous le marché.",
      }
    );
    expect(result?.error).toMatch(/insultes/i);
  });

  it("detects ban in combined text across fields", async () => {
    const result = await submitWith(
      "Travail intéressant mais appeler le 077 111 22 33 pour vérifier les conditions réelles.",
      { pros: "Rien de spécial", cons: "Voir contenu" }
    );
    expect(result?.error).toMatch(/téléphone/i);
  });

  it("passes clean, detailed, critical review without false positive", async () => {
    const result = await submitWith(
      "L'entreprise souffre d'un management intermédiaire défaillant et d'une communication verticale catastrophique. " +
      "Les décisions sont prises sans consulter les équipes terrain, ce qui génère une frustration généralisée. " +
      "Le turnover est très élevé et la direction ne semble pas en prendre conscience malgré les signaux d'alarme répétés.",
      {
        pros: "Bons avantages sociaux, flexibilité horaire réelle, bureau bien situé en centre-ville.",
        cons: "Management toxique, absence de feedback constructif, salaires bloqués depuis 3 ans.",
      }
    );
    expect(result?.error).toBeUndefined();
  });
});
