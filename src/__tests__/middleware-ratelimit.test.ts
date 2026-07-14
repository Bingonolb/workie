import { describe, it, expect, beforeEach } from "vitest";

// Test the rate limiting logic in isolation (pure function extracted for testability)
const RL_WINDOW = 60_000;
const rl = new Map<string, [number, number]>();

function rateLimited(ip: string, route: string, limit: number): boolean {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const entry = rl.get(key);
  if (!entry || now - entry[1] > RL_WINDOW) {
    rl.set(key, [1, now]);
    return false;
  }
  if (entry[0] >= limit) return true;
  entry[0]++;
  return false;
}

describe("rateLimited", () => {
  beforeEach(() => rl.clear());

  it("allows requests below the limit", () => {
    for (let i = 0; i < 30; i++) {
      expect(rateLimited("1.2.3.4", "search", 30)).toBe(false);
    }
  });

  it("blocks requests exceeding the limit", () => {
    for (let i = 0; i < 30; i++) rateLimited("1.2.3.4", "search", 30);
    expect(rateLimited("1.2.3.4", "search", 30)).toBe(true);
  });

  it("different IPs have independent counters", () => {
    for (let i = 0; i < 30; i++) rateLimited("1.2.3.4", "search", 30);
    // Second IP should NOT be blocked
    expect(rateLimited("9.9.9.9", "search", 30)).toBe(false);
  });

  it("counter resets after window expires", () => {
    for (let i = 0; i < 30; i++) rateLimited("1.2.3.4", "search", 30);
    // Manually expire the entry
    rl.set("1.2.3.4:search", [30, Date.now() - RL_WINDOW - 1]);
    expect(rateLimited("1.2.3.4", "search", 30)).toBe(false);
  });
});
