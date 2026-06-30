"use client";

import Image from "next/image";
import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-200">
          {profile?.avatar_url && (
            <Image src={profile.avatar_url} alt="avatar" width={64} height={64} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <p className="font-semibold">@{profile?.username}</p>
          <p className="text-sm text-neutral-500">{email}</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Photo de profil</label>
        <input name="avatar" type="file" accept="image/*" className="w-full text-sm" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Nom complet</label>
        <input
          name="full_name"
          defaultValue={profile?.full_name ?? ""}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Ville</label>
          <input
            name="city"
            defaultValue={profile?.city ?? ""}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Pays</label>
          <input
            name="country"
            defaultValue={profile?.country ?? ""}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Bio</label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={profile?.bio ?? ""}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-dark">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Profil mis à jour.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
