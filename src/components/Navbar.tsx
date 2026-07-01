import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

// No extra DB query — avatar and username loaded via NavbarAvatar client component
export async function Navbar() {
  const user = await getUser();
  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "#ffffff",
      borderBottom: "1px solid #e8e8e8",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 40 }}>
        <Link href="/discover" style={{ textDecoration: "none", fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "#111", flexShrink: 0 }}>
          Watch<span style={{ color: "#e8445a" }}>Swap</span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", flex: 1 }}>
          {[
            { href: "/discover", label: "Découvrir" },
            { href: "/matches",  label: "Mes échanges" },
            { href: "/messages", label: "Messages" },
            { href: "/profile",  label: "Profil" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: "0 18px", height: 64, display: "flex", alignItems: "center",
              fontSize: 14, fontWeight: 500, color: "#555", textDecoration: "none",
            }}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <Link href="/watches/new" style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#e8445a", color: "#fff", fontWeight: 700,
            borderRadius: 8, padding: "8px 16px", textDecoration: "none", fontSize: 13,
          }}>
            <Plus size={14} strokeWidth={2.5} /> Ajouter
          </Link>

          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}>
            <Bell size={20} />
          </button>

          <Link href="/profile" style={{ textDecoration: "none" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "linear-gradient(135deg, #e8445a, #ff7a8a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#fff",
            }}>
              {initial}
            </div>
          </Link>

          <form action={signOut}>
            <button type="submit" style={{ background: "none", border: "none", fontSize: 13, color: "#bbb", cursor: "pointer" }}>
              Déco
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
