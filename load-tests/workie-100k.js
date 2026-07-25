/**
 * k6 Load Test — Workie 100K readiness
 *
 * Usage:
 *   k6 run load-tests/workie-100k.js
 *   k6 run --env BASE_URL=https://www.workie.ch load-tests/workie-100k.js
 *
 * Ramp profile:
 *   0:00 →  1:00   ramp 0 → 50 VUs     (warm-up)
 *   1:00 →  3:00   hold 50 VUs          (baseline)
 *   3:00 →  5:00   ramp 50 → 300 VUs   (stress)
 *   5:00 →  9:00   hold 300 VUs         (sustained load)
 *   9:00 → 11:00   ramp 300 → 500 VUs  (peak)
 *  11:00 → 13:00   hold 500 VUs         (peak sustained)
 *  13:00 → 14:00   ramp 500 → 0        (cool-down)
 *
 * Thresholds (must pass for the test to PASS):
 *   - 95% of page requests < 2000ms
 *   - 95% of API requests  < 500ms
 *   - Error rate < 1%
 */

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

// ── Config ──────────────────────────────────────────────────────────────────

const BASE = __ENV.BASE_URL || "https://www.workie.ch";

// Real company IDs from production DB (high profile_score, cover the hot path)
const COMPANY_IDS = [
  "a7201605-fafc-4dcd-8d2e-b8678dd45c2d", // On Running
  "535d7f5a-9331-461f-9335-4293cedb1445", // McKinsey
  "6eaffab7-56fa-4f85-83d5-d7885483ef9e", // Roche
  "fdf00890-d536-4802-84fc-9476ff3a2ce2",
  "37f4128a-bb4a-4dfd-9f5e-5943fc990b57",
  "6fee2891-d8aa-46ba-a194-27e3e571591c",
  "449cf60f-cfb5-4a67-b6b0-856d12052abd",
  "18a82ca7-0a83-47e3-be52-581be5e33165", // BCV
  "49acff4a-6205-47c8-b9c0-b190862bbf79",
  "05229ac6-49ba-461a-9f8d-fe9d06f88fb2", // UBS
  "24cf29d5-59a9-426b-8447-5387240e54a6", // KPMG
  "14855ecf-39ba-4c6d-8dc1-96b3cac59e2a", // Spotify Lausanne
  "985dc540-87c6-4d5e-9f9e-77adcd48f13d",
  "50fdcaf8-a6c7-453d-b87e-d9d086d0b2c7",
  "53966179-0d3e-4392-b18b-2e4742fcebf2",
  "3dc87990-b2e3-4096-bd21-bb658f7d2a42",
  "20e823cb-b370-43d0-ae54-c88855b3cdb4",
  "61f44cee-8720-426c-ac83-8c2794811f0d",
  "9b7a2d66-3b93-4184-baa5-bddce0b5fb7e",
  "948fe1e6-4885-46e4-bd8a-5d98baad5c6e",
];

const SEARCH_TERMS = [
  "UBS", "Nestlé", "Novartis", "Roche", "ABB", "Swatch", "Credit",
  "Tech", "Bank", "Consulting", "EPFL", "UNIL", "Swiss",
];

const SECTORS = ["tech", "finance", "sante", "formation", "industrie"];
const CANTONS = ["GE", "VD", "ZH", "BS", "BE", "AG"];

// ── Custom metrics ───────────────────────────────────────────────────────────

const errorRate   = new Rate("errors");
const pageTrend   = new Trend("page_duration",   true);
const apiTrend    = new Trend("api_duration",    true);
const searchTrend = new Trend("search_duration", true);

// ── Thresholds ───────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: "1m",  target: 50  },  // warm-up
    { duration: "2m",  target: 50  },  // baseline
    { duration: "2m",  target: 300 },  // stress ramp
    { duration: "4m",  target: 300 },  // sustained load
    { duration: "2m",  target: 500 },  // peak ramp
    { duration: "2m",  target: 500 },  // peak sustained
    { duration: "1m",  target: 0   },  // cool-down
  ],
  thresholds: {
    // Core SLA: page loads under 2s at p95
    page_duration:   ["p(95)<2000"],
    // API calls (search, etc.) under 500ms at p95
    api_duration:    ["p(95)<500"],
    search_duration: ["p(95)<800"],
    // Overall HTTP error rate under 1%
    errors:          ["rate<0.01"],
    // k6 built-in: also check raw http_req_duration
    http_req_duration: ["p(95)<2500"],
    http_req_failed:   ["rate<0.01"],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function get(url, tags) {
  const res = http.get(url, {
    headers: { "Accept": "text/html,application/xhtml+xml" },
    tags,
  });
  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "no error boundary": (r) => !r.body || !r.body.includes("Une erreur s'est produite"),
  });
  errorRate.add(!ok);
  return res;
}

function getJson(url, tags) {
  const res = http.get(url, {
    headers: { "Accept": "application/json" },
    tags,
  });
  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "valid json": (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  errorRate.add(!ok);
  return res;
}

// ── Scenario weights ─────────────────────────────────────────────────────────
// Realistic distribution observed on Swiss professional platforms:
//   50% browse explore / ranking
//   25% view company page (direct link or from explore)
//   15% search
//   10% static/legal pages (low cost, validates CDN)

export default function () {
  const roll = Math.random();

  if (roll < 0.30) {
    // ── Explore page (most common landing) ──────────────────────────────────
    group("explore", () => {
      const start = Date.now();
      get(`${BASE}/explore`, { page: "explore" });
      pageTrend.add(Date.now() - start);
      sleep(Math.random() * 3 + 1);
    });

  } else if (roll < 0.50) {
    // ── Explore with filters ─────────────────────────────────────────────────
    group("explore_filtered", () => {
      const sector = pick(SECTORS);
      const canton = pick(CANTONS);
      const start = Date.now();
      // Simulates the grid view URL with filter params
      get(`${BASE}/explore?sector=${sector}&canton=${canton}`, { page: "explore_filtered" });
      pageTrend.add(Date.now() - start);
      sleep(Math.random() * 2 + 1);
    });

  } else if (roll < 0.70) {
    // ── Company page ─────────────────────────────────────────────────────────
    group("company_page", () => {
      const companyId = pick(COMPANY_IDS);
      const start = Date.now();
      const res = get(`${BASE}/company/${companyId}`, { page: "company" });
      pageTrend.add(Date.now() - start);
      check(res, { "has company content": (r) => r.body && r.body.includes("avis") });
      sleep(Math.random() * 4 + 2); // Users read the page
    });

  } else if (roll < 0.80) {
    // ── Ranking page ─────────────────────────────────────────────────────────
    group("ranking", () => {
      const start = Date.now();
      get(`${BASE}/ranking`, { page: "ranking" });
      pageTrend.add(Date.now() - start);
      sleep(Math.random() * 3 + 1);
    });

  } else if (roll < 0.93) {
    // ── Search API ───────────────────────────────────────────────────────────
    group("search", () => {
      const q = encodeURIComponent(pick(SEARCH_TERMS));
      const start = Date.now();
      const res = getJson(`${BASE}/api/companies/search?q=${q}`, { endpoint: "search" });
      const duration = Date.now() - start;
      apiTrend.add(duration);
      searchTrend.add(duration);
      check(res, {
        "companies array": (r) => {
          try { return Array.isArray(JSON.parse(r.body).companies); } catch { return false; }
        },
      });
      sleep(Math.random() * 1 + 0.5);
    });

  } else {
    // ── Static / legal pages (CDN cache hit validation) ──────────────────────
    group("static_pages", () => {
      const page = pick(["/", "/login", "/signup", "/cgu", "/confidentialite", "/mentions-legales"]);
      const start = Date.now();
      get(`${BASE}${page}`, { page: "static" });
      pageTrend.add(Date.now() - start);
      sleep(Math.random() * 1 + 0.5);
    });
  }
}
