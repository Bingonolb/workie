import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Column-security invariants (pure static assertions, no mocking needed) ──

import { REVIEW_PUBLIC_COLS, COMPANY_PUBLIC_COLS } from "@/lib/actions/columns";

describe("REVIEW_PUBLIC_COLS", () => {
  const cols = REVIEW_PUBLIC_COLS.split(",");

  it("never exposes submitter_ip to the frontend", () => {
    expect(cols).not.toContain("submitter_ip");
  });

  it("never exposes flag_reason to the frontend", () => {
    expect(cols).not.toContain("flag_reason");
  });

  it("includes all fields required to render a review card", () => {
    const required = [
      "id", "company_id", "user_id", "rating_overall", "content",
      "pros", "cons", "job_title", "helpful_count", "created_at",
      "status", "is_verified_author", "is_anonymous",
    ];
    for (const col of required) {
      expect(cols).toContain(col);
    }
  });
});

describe("COMPANY_PUBLIC_COLS", () => {
  const cols = COMPANY_PUBLIC_COLS.split(",");

  it("never exposes stripe_customer_id to the frontend", () => {
    expect(cols).not.toContain("stripe_customer_id");
  });

  it("never exposes stripe_subscription_id to the frontend", () => {
    expect(cols).not.toContain("stripe_subscription_id");
  });

  it("never exposes claimed_by to the frontend", () => {
    expect(cols).not.toContain("claimed_by");
  });

  it("never exposes subscription billing internals to the frontend", () => {
    expect(cols).not.toContain("subscription_ends_at");
    expect(cols).not.toContain("subscription_cancel_at_period_end");
  });

  it("includes all fields required to render a company card and page", () => {
    const required = [
      "id", "name", "sector", "city", "avg_rating", "review_count",
      "cover_url", "logo_url", "is_verified", "is_subscribed", "score",
      "website_url", "linkedin_url", "description",
    ];
    for (const col of required) {
      expect(cols).toContain(col);
    }
  });
});

// ── submitReview per-user 24h rate limit ─────────────────────────────────────

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })),
  headers: vi.fn(async () => ({ get: vi.fn(() => null) })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => {
    const proxy: unknown = new Proxy({}, {
      get: (_t, prop) => {
        if (prop === "then") return undefined;
        return () => proxy;
      },
    });
    return proxy;
  }),
}));

import { submitReview } from "@/lib/actions/reviews";

function makeFormData(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  const defaults: Record<string, string> = {
    company_id: "company-1",
    rating_overall: "4",
    content: "C'est une entreprise vraiment très bien. Bonne ambiance, bon management, bonnes perspectives de carrière.",
    pros: "Très bonne ambiance de travail et collègues sympa.",
    cons: "Quelques problèmes de communication interne.",
    job_title: "Développeur",
    duration_range: "1-3 ans",
    would_recommend: "oui",
    ...overrides,
  };
  for (const [k, v] of Object.entries(defaults)) fd.set(k, v);
  return fd;
}

describe("submitReview — per-user 24h rate limit", () => {
  beforeEach(() => vi.clearAllMocks());

  // Builds a supabase mock for submitReview with configurable recentCount.
  // Chain structure mirrors exactly what submitReview does:
  //   profiles:  .select().eq().maybeSingle() → profile
  //   companies: .select().eq().maybeSingle() → company
  //   reviews (dupe check):   .select().eq().eq().maybeSingle() → null (no prior review)
  //   reviews (rate limit):   .select(id, {count,head}).eq().gte() → {count: N}
  function makeReviewsClient(recentCount: number) {
    const user = { id: "u1", email_confirmed_at: "2025-01-01", created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() };
    return {
      auth: { getUser: async () => ({ data: { user } }) },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { claimed_company_id: null, identity_verified: false } }) }) }) };
        }
        if (table === "companies") {
          return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "c1", name: "ACME" } }) }) }) };
        }
        if (table === "reviews") {
          return {
            // The dupe-per-company check: .select(cols).eq(company_id).eq(user_id).maybeSingle()
            // The rate-limit check:        .select(id, {count,head}).eq(user_id).gte(created_at)
            select: (_cols: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.count === "exact") {
                // Rate-limit count query
                return { eq: () => ({ gte: () => Promise.resolve({ count: recentCount, data: null, error: null }) }) };
              }
              // Duplicate-per-company check (no prior review)
              return { eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
            },
            insert: async () => ({ error: null }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) };
      }),
    } as any;
  }

  it("allows submission when user has 0 reviews in the last 24h", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(makeReviewsClient(0));
    const result = await submitReview(undefined, makeFormData());
    // May hit other checks (content quality etc.) but NOT the rate limit
    expect(result?.error).not.toBe("Tu as atteint la limite de 3 avis par 24h. Réessaie demain.");
  });

  it("blocks submission when user has 3 reviews in the last 24h", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue(makeReviewsClient(3));
    const result = await submitReview(undefined, makeFormData());
    expect(result?.error).toBe("Tu as atteint la limite de 3 avis par 24h. Réessaie demain.");
  });
});
