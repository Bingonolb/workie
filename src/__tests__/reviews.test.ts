import { describe, it, expect, vi, beforeEach } from "vitest";

// Supabase mock factory — returns a builder that resolves each .from() chain
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    from: mockFrom,
    rpc: vi.fn(async () => ({ error: null })),
  })),
}));

// Admin client used by isIpAbuse and findSimilarReview — no env vars in test
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => {
      const proxy: Record<string, unknown> = new Proxy({}, {
        get(_t, prop: string) {
          if (prop === "then") return undefined;
          if (prop === "maybeSingle") return async () => ({ data: null, error: null });
          if (prop === "gte" || prop === "lt" || prop === "lte" || prop === "gt") {
            return () => Promise.resolve({ data: [], count: 0, error: null });
          }
          return () => proxy;
        },
      });
      return proxy;
    }),
  })),
}));

import { submitReview, voteHelpful } from "@/lib/actions/reviews";

// Helper to build a chainable Supabase query builder that resolves to `result`
function chain(result: unknown) {
  const b: Record<string, unknown> = {};
  const self = () => b;
  ["select", "eq", "not", "ilike", "order", "limit", "maybeSingle", "insert", "delete", "update"].forEach(
    (m) => { b[m] = self; }
  );
  b["maybeSingle"] = async () => result;
  b["insert"] = async () => result;
  b["delete"] = () => ({ eq: () => ({ eq: async () => ({ error: null }) }) });
  return b;
}

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  return fd;
}

const validReviewFields = {
  company_id: "company-uuid",
  rating_overall: "4",
  title: "Super boîte",
  content: "C'est une entreprise vraiment bien où j'ai beaucoup appris et progressé.",
  pros: "Bonne ambiance et collègues sympa",
  cons: "Salaire en dessous du marché",
  job_title: "Développeur",
  duration_range: "1-3 ans",
  employment_type: "cdi",
  work_mode: "hybride",
  would_recommend: "oui",
};

describe("submitReview", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: mockFrom,
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await submitReview(undefined, makeFormData(validReviewFields));
    expect(result?.error).toMatch(/connecté/);
  });

  // A verified user whose account is older than 24h — passes the security gates
  const verifiedUser = {
    id: "user-1",
    email_confirmed_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
  };

  it("returns error when company_id is missing", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: verifiedUser } }) },
      from: vi.fn(() => chain({ data: null })),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const fd = makeFormData({ ...validReviewFields, company_id: "" });
    const result = await submitReview(undefined, fd);
    expect(result?.error).toMatch(/manquante/i);
  });

  it("returns error when rating_overall is 0", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: verifiedUser } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") return chain({ data: { claimed_company_id: null } });
        if (table === "companies") return chain({ data: { id: "company-uuid" } });
        return chain({ data: null });
      }),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const fd = makeFormData({ ...validReviewFields, rating_overall: "0" });
    const result = await submitReview(undefined, fd);
    expect(result?.error).toMatch(/note globale/i);
  });

  // Le test « content trop court » a été retiré : la longueur minimale de
  // l'avis n'existe plus depuis le passage au format 100% notes, où aucun
  // texte n'est collecté. Il validait une règle supprimée.

  it("blocks business accounts from posting reviews", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { ...verifiedUser, id: "user-biz" } } }) },
      from: vi.fn(() => chain({ data: { claimed_company_id: "company-uuid" } })),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await submitReview(undefined, makeFormData(validReviewFields));
    expect(result?.error).toMatch(/comptes entreprise/i);
  });

  it("blocks duplicate review for same user+company", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: verifiedUser } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") return chain({ data: { claimed_company_id: null } });
        if (table === "companies") return chain({ data: { id: "company-uuid" } });
        return chain({ data: null });
      }),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    // La garde anti-doublon interroge reviews par la clé de service : elle
    // filtre sur user_id, colonne fermée aux rôles anon et authenticated.
    // Simuler l'ancien client validerait une garde qui ne s'exécute plus.
    vi.mocked(createAdminClient).mockReturnValueOnce({
      from: vi.fn(() => chain({ data: { id: "existing-review" } })),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await submitReview(undefined, makeFormData(validReviewFields));
    expect(result?.error).toMatch(/déjà posté/i);
  });
});

describe("voteHelpful", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: vi.fn(),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await voteHelpful("review-1");
    expect(result.error).toMatch(/authentifié/i);
  });

  it("blocks business accounts from voting", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "user-biz" } } }) },
      from: vi.fn(() => chain({ data: { claimed_company_id: "company-uuid" } })),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await voteHelpful("review-1");
    expect(result.error).toMatch(/entreprise/i);
  });

  it("returns alreadyVoted on 23505 unique constraint", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") return chain({ data: { claimed_company_id: null } });
        if (table === "review_votes") return chain({ error: { code: "23505" } });
        return chain({ data: null });
      }),
      rpc: vi.fn(),
    } as unknown as Awaited<ReturnType<typeof createClient>>);
    const result = await voteHelpful("review-1");
    expect(result.alreadyVoted).toBe(true);
    expect(result.error).toBeUndefined();
  });
});
