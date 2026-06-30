import { Navbar } from "@/components/Navbar";
import { NewWatchForm } from "@/components/NewWatchForm";

export default function NewWatchPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-bold">Ajouter une montre</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Ajoute les infos et jusqu&apos;à 5 photos pour la proposer à l&apos;échange.
        </p>
        <NewWatchForm />
      </main>
    </div>
  );
}
