"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithGoogle } from "@/lib/actions/auth";

type ActionResult = { error?: string } | undefined;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: (
    state: ActionResult,
    formData: FormData
  ) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div className="w-full max-w-sm space-y-4">
    <form action={formAction} className="space-y-4">
      {mode === "signup" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Pseudo
          </label>
          <input
            name="username"
            required
            placeholder="alex_montres"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input
          type="email"
          name="email"
          required
          placeholder="toi@email.com"
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 font-semibold text-white shadow-lg shadow-black/10 transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending
          ? "Patiente..."
          : mode === "login"
          ? "Se connecter"
          : "Créer mon compte"}
      </button>

      <p className="text-center text-sm text-neutral-500">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-medium text-brand">
              Inscris-toi
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-brand">
              Connecte-toi
            </Link>
          </>
        )}
      </p>

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        ou
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

    </form>

    <form action={signInWithGoogle}>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-3 font-semibold text-neutral-700 transition hover:bg-neutral-50"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" />
          <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
        </svg>
        Continuer avec Google
      </button>
    </form>
    </div>
  );
}
