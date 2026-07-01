"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Nom complet</label>
          <input
            name="full_name"
            defaultValue={profile?.full_name ?? ""}
            placeholder="Alexandre Martin"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Ville</label>
          <input
            name="city"
            defaultValue={profile?.city ?? ""}
            placeholder="Paris"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Pays</label>
          <input
            name="country"
            defaultValue={profile?.country ?? ""}
            placeholder="France"
            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">Bio</label>
          <textarea
            name="bio"
            rows={3}
            defaultValue={profile?.bio ?? ""}
            placeholder="Collectionneur passionné depuis 10 ans, spécialisé Rolex et AP..."
            className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/10"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Photo de profil
          </label>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold uppercase text-neutral-400">
                  {profile?.username?.[0] ?? "?"}
                </span>
              )}
            </div>
            <input
              name="avatar"
              type="file"
              accept="image/*"
              className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-brand file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-500">
        Email : <span className="font-medium text-neutral-700">{email}</span>
      </div>

      {state?.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">Profil mis à jour ✓</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer les modifications"}
      </button>
    </form>
  );
}
