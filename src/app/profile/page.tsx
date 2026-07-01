import Link from "next/link";
import { MapPin, Shield, Watch, Repeat2, Calendar, ChevronRight, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ProfileForm } from "@/components/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Watch as WatchType } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: watches }, { count: matchesCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
    supabase.from("watches").select("id,brand,model,photos,status,condition").eq("owner_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("matches").select("id", { count: "exact", head: true }).or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`),
  ]);

  const p = profile as Profile | null;
  const watchList = (watches ?? []) as unknown as (WatchType & { photos: string[] })[];
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero banner */}
      <div className="relative h-32 bg-gradient-to-br from-brand to-brand-dark">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #fff4 0%, transparent 50%)" }} />
      </div>

      <main className="mx-auto max-w-2xl px-4 pb-16">

        {/* Avatar + identity */}
        <div className="-mt-14 mb-6 flex items-end justify-between">
          <div className="relative">
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="avatar"
                className="h-24 w-24 rounded-2xl border-4 border-white object-cover shadow-lg" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-brand-light shadow-lg">
                <span className="text-3xl font-black text-brand uppercase">
                  {p?.username?.[0] ?? user?.email?.[0] ?? "?"}
                </span>
              </div>
            )}
            {p?.identity_verified && (
              <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow">
                <Shield size={13} fill="currentColor" />
              </span>
            )}
          </div>
          <Link href="/watches/new"
            className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-brand-dark">
            <Plus size={14} /> Ajouter une montre
          </Link>
        </div>

        {/* Name + location */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold">
            {p?.full_name || `@${p?.username}` || "Mon profil"}
          </h1>
          <p className="text-sm font-medium text-brand">@{p?.username}</p>
          {(p?.city || p?.country) && (
            <p className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
              <MapPin size={13} /> {[p.city, p.country].filter(Boolean).join(", ")}
            </p>
          )}
          {p?.bio && <p className="mt-2 text-sm leading-relaxed text-neutral-600">{p.bio}</p>}
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 divide-x divide-neutral-200 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col items-center gap-0.5 py-4">
            <Watch size={16} className="text-brand" />
            <span className="text-xl font-bold">{watchList.length}</span>
            <span className="text-xs text-neutral-500">Montres</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4">
            <Repeat2 size={16} className="text-brand" />
            <span className="text-xl font-bold">{matchesCount ?? 0}</span>
            <span className="text-xs text-neutral-500">Échanges</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 py-4">
            <Calendar size={16} className="text-brand" />
            <span className="text-xl font-bold">{memberSince}</span>
            <span className="text-xs text-neutral-500">Membre</span>
          </div>
        </div>

        {/* Trust badge */}
        {!p?.identity_verified && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <Shield size={20} className="shrink-0 text-brand" />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-neutral-800">Vérifiez votre identité</p>
              <p className="text-neutral-500">Les collectionneurs vérifiés échangent 3× plus.</p>
            </div>
            <ChevronRight size={16} className="text-neutral-400" />
          </div>
        )}
        {p?.identity_verified && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
            <Shield size={20} className="shrink-0 text-green-600" fill="currentColor" />
            <div className="text-sm">
              <p className="font-semibold text-neutral-800">Identité vérifiée</p>
              <p className="text-neutral-500">Vos échanges inspirent confiance.</p>
            </div>
          </div>
        )}

        {/* Ma collection */}
        {watchList.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Ma collection</h2>
              <Link href="/watches/mine" className="text-xs font-medium text-brand hover:underline">
                Tout voir
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {watchList.slice(0, 6).map((w) => (
                <div key={w.id} className="relative aspect-square overflow-hidden rounded-xl bg-neutral-200">
                  {w.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.photos[0]} alt={w.brand} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                      {w.brand}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="truncate text-[10px] font-semibold text-white">{w.brand}</p>
                    <p className="truncate text-[9px] text-white/80">{w.model}</p>
                  </div>
                  {w.status !== "available" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-neutral-700">
                        {w.status === "paused" ? "En pause" : "Échangée"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {watchList.length === 0 && (
          <Link href="/watches/new"
            className="mb-6 flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center transition hover:border-brand">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light">
              <Plus size={22} className="text-brand" />
            </div>
            <p className="font-semibold text-neutral-700">Ajoutez votre première montre</p>
            <p className="text-sm text-neutral-400">Les collectionneurs sans montre ne peuvent pas matcher.</p>
          </Link>
        )}

        {/* Edit form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-base font-semibold">Modifier mon profil</h2>
          <ProfileForm profile={p} email={user!.email ?? ""} />
        </div>
      </main>
    </div>
  );
}
