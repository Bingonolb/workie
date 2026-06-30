import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/discover");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-neutral-100 px-6 text-center">
      <h1 className="text-5xl font-black tracking-tight">
        <span className="text-brand">Watch</span>Swap
      </h1>
      <p className="mt-4 max-w-md text-neutral-600">
        Troque tes montres avec des passionnés. Swipe, matche, échange — sans
        commission.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white shadow-lg shadow-red-200 transition hover:bg-brand-dark"
        >
          Créer un compte
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          Se connecter
        </Link>
      </div>
    </main>
  );
}
