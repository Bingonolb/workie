import { SlidersHorizontal } from "lucide-react";

export function FiltersSidebar({
  brands,
  selectedBrand,
  selectedCondition,
}: {
  brands: string[];
  selectedBrand?: string;
  selectedCondition?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Filtres</h3>
      <form method="get" className="space-y-4 text-sm">
        <div>
          <label className="mb-1 block text-neutral-500">Marque</label>
          <select
            name="brand"
            defaultValue={selectedBrand || ""}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          >
            <option value="">Toutes</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-neutral-500">État</label>
          <select
            name="condition"
            defaultValue={selectedCondition || ""}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2"
          >
            <option value="">Tous</option>
            <option value="neuf">Neuf</option>
            <option value="excellent">Excellent état</option>
            <option value="tres_bon">Très bon état</option>
            <option value="bon">Bon état</option>
            <option value="correct">État correct</option>
          </select>
        </div>
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-2.5 font-medium text-white"
        >
          <SlidersHorizontal size={14} /> Appliquer
        </button>
      </form>
    </div>
  );
}
