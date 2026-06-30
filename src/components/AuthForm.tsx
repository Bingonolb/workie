"use client";

import { useActionState } from "react";
import Link from "next/link";

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
    <form action={formAction} className="w-full max-w-sm space-y-4">
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
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-dark">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-brand-dark disabled:opacity-60"
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
    </form>
  );
}
