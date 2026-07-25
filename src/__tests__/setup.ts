// Mock Next.js server-only modules
import { vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  // Pass-through: returns the function as-is so cached functions can be tested directly
  unstable_cache: vi.fn((fn: unknown) => fn),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn(() => ({ getAll: () => [], set: vi.fn() })) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`); }) }));
