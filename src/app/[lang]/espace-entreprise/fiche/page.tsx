import { ficheGeree } from "@/lib/actions/espaceEntreprise";
import { FormulaireFiche } from "./FormulaireFiche";

export default async function PageFiche() {
  const c = await ficheGeree();
  if (!c) return null;
  return <FormulaireFiche c={c} />;
}
