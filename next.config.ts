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
      // unsafe-eval only in dev (Next.js HMR); stripped in production builds
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://js.stripe.com https://*.sentry.io`,
      // Inline styles used throughout the app via style={{...}}
      "style-src 'self' 'unsafe-inline'",
      // Hôtes d'images limités à ceux réellement utilisés. « https: » autorisait
      // n'importe quel domaine : une URL d'image est un canal de sortie, et un
      // contenu injecté pouvait exfiltrer des données en la chargeant depuis un
      // serveur tiers. La liste reprend exactement remotePatterns ci-dessous.
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.pexels.com https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://picsum.photos",
      "font-src 'self' data:",
      // Supabase realtime + Sentry + Stripe
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://api.stripe.com",
      // Stripe checkout iframe
      "frame-src https://js.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      // Interdit l'inclusion du site dans une iframe tierce. X-Frame-Options le
      // fait déjà, mais c'est la directive CSP qui fait autorité pour les
      // navigateurs récents, et elle gère les cas que l'en-tête ancien ignore.
      "frame-ancestors 'none'",
      // Toute requête restante en clair est promue en HTTPS avant d'être émise.
      "upgrade-insecure-requests",
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
    // Cache dynamic pages 5s client-side — eliminates nav lag, stale window short enough for score freshness
    staleTimes: { dynamic: 30, static: 300 },
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      // Bannières d'entreprise. Sans cette entrée, next/image lève côté serveur
      // et la fiche renvoie une 500 — l'échec ne se voit pas au build.
      { protocol: "https", hostname: "images.pexels.com" },
      // logo.clearbit.com a été retiré : les logos d'entreprise sont des marques
      // déposées et 588 fiches en affichaient un sans autorisation. Le champ
      // logo_url est vidé en base et LogoImg affiche les initiales à la place.
    ],
    // Cache optimised images for 7 days on Vercel CDN (default is 60s — way too short)
    minimumCacheTTL: 604800,
    formats: ["image/avif", "image/webp"],
    // Mobile-first device sizes — avoids generating unneeded sizes
    deviceSizes: [375, 640, 828, 1080, 1200, 1920],
    imageSizes: [38, 48, 64, 96, 128, 256],
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
