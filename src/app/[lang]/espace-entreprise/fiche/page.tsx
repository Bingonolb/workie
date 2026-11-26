import { ficheGeree, listerPhotos } from "@/lib/actions/espaceEntreprise";
import { FormulaireFiche } from "./FormulaireFiche";
import { GestionCoulisses } from "./GestionCoulisses";

export default async function PageFiche() {
  const [c, photos] = await Promise.all([ficheGeree(), listerPhotos()]);
  if (!c) return null;
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormulaireFiche c={c} />
      <GestionCoulisses initiales={photos} />
    </div>
  );
}
