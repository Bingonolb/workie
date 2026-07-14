import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { toggleFavorite } from "@/lib/actions/favorites";

describe("toggleFavorite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing silently when user is not authenticated", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: null } }) },
      from: vi.fn(),
    } as any);
    await expect(toggleFavorite("company-1")).resolves.toBeUndefined();
  });

  it("does not throw on concurrent insert (23505)", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    const deleteMock = vi.fn(async () => ({ error: null }));
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "favorites") {
          return {
            select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
            insert: async () => ({ error: { code: "23505" } }),
            delete: () => ({ eq: () => ({ eq: deleteMock }) }),
          };
        }
        return {};
      }),
    } as any);
    await expect(toggleFavorite("company-1")).resolves.toBeUndefined();
  });

  it("throws on unexpected DB error during insert", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => ({
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
        insert: async () => ({ error: { code: "42501", message: "RLS violation" } }),
      })),
    } as any);
    await expect(toggleFavorite("company-1")).rejects.toMatchObject({ code: "42501" });
  });
});
