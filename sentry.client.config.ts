import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 100% des erreurs, 10% des traces perf
  tracesSampleRate: 0.1,

  // En dev, désactiver pour ne pas polluer Sentry
  enabled: process.env.NODE_ENV === "production",

  // Ignore les erreurs réseau bénignes côté client
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});
