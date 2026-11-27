import { ficheGeree, listerPhotos } from "@/lib/actions/espaceEntreprise";
import { FormulaireFiche } from "./FormulaireFiche";
import { GestionCoulisses } from "./GestionCoulisses";

export default async function PageFiche() {
  const [c, photos] = await Promise.all([ficheGeree(), listerPhotos()]);
  if (!c) return null;
  // minmax(0, 1fr) : sans cela, la colonne prenait la largeur de son contenu
  // le plus large et débordait de l'écran sur téléphone.
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
      <FormulaireFiche c={c} />
      <GestionCoulisses initiales={photos} />
    </div>
  );
}
