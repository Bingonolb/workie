import * as Sentry from "@sentry/nextjs";

/**
 * Captures unexpected server-side errors to Sentry in production.
 * In development, logs to console so stack traces stay readable.
 *
 * Use for errors in catch blocks that signal infrastructure or DB issues —
 * NOT for expected user-facing errors (auth, validation, 23505 constraints).
 */
export function captureServerError(
  error: unknown,
  context: { action: string; [key: string]: unknown }
): void {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error(`[${context.action}]`, error, context);
  }
}
