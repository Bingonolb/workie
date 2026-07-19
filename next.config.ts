import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Minimal referrer leakage
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  // DNS prefetching
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS — 1 year, include subdomains (activate only after SSL is confirmed stable)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // CSP — allows inline styles (required by the app) and Next.js inline scripts
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js injects inline scripts; unsafe-eval needed for dev HMR (removed in prod by Sentry)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.sentry.io",
      // Inline styles used throughout the app via style={{...}}
      "style-src 'self' 'unsafe-inline'",
      // Supabase storage + external image hosts
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // Supabase realtime + Sentry + Stripe
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://api.stripe.com",
      // Stripe checkout iframe
      "frame-src https://js.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      // Stripe checkout POST redirect
      "form-action 'self' https://checkout.stripe.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 20MB was excessive; max realistic: cover image (5MB) + logo (2MB)
      bodySizeLimit: "8mb",
    },
    // Cache dynamic page renders client-side for 30s — eliminates the ½s lag on nav
    // After 30s the next navigation re-fetches in background while showing stale instantly
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "workiech",
  project: "javascript-nextjs",
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: true,
  },
});
