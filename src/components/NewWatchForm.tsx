"use client";

import { useActionState } from "react";
import { createWatch } from "@/lib/actions/watches";
import { CONDITION_LABELS } from "@/lib/types";

export function NewWatchForm() {
  const [state, formAction, pending] = useActionState(createWatch, undefined);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Marque</label>
          <input
            name="brand"
            required
            placeholder="Rolex"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Modèle</label>
          <input
            name="model"
            required
            placeholder="Submariner"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Année</label>
          <input
            name="year"
            type="number"
            min={1900}
            max={2030}
            placeholder="2020"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">État</label>
          <select
            name="condition"
            required
            defaultValue=""
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Ville</label>
          <input
            name="city"
            placeholder="Genève"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Pays</label>
          <input
            name="country"
            placeholder="Suisse"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Détails, accessoires inclus, raison de l'échange..."
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Prix d&apos;achat</label>
          <input
            name="purchase_price"
            type="number"
            min={0}
            step="100"
            placeholder="32000"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Devise</label>
          <select
            name="currency"
            defaultValue="EUR"
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 outline-none focus:border-brand"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">Provenance et authenticité</label>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
            <input type="checkbox" name="has_proof_of_purchase" className="accent-brand" /> Preuve d&apos;achat
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
            <input type="checkbox" name="has_certificate_authenticity" className="accent-brand" /> Certificat d&apos;authenticité
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
            <input type="checkbox" name="has_box" className="accent-brand" /> Boîte d&apos;origine
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-2">
            <input type="checkbox" name="has_papers" className="accent-brand" /> Papiers / garantie
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Photos (jusqu&apos;à 5)
        </label>
        <input
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="w-full rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm outline-none focus:border-brand"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-dark">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand py-3 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Publication..." : "Publier la montre"}
      </button>
    </form>
  );
}
