import Link from "next/link";
import { signUp, signInWithGoogle } from "@/lib/actions/auth";
import { AuthFormWorkie } from "@/components/AuthFormWorkie";

export default function SignupPage() {
  return (
    <main style={{ minHeight: "100dvh", background: "#0d0d13", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <span style={{
          fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, #8b5cf6, #f97316)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          workie
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 400, background: "#16161f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "36px 32px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f8", marginBottom: 6 }}>Créer un compte</h1>
        <p style={{ fontSize: 14, color: "rgba(240,240,248,0.4)", marginBottom: 28 }}>
          Déjà un compte ?{" "}
          <Link href="/login" style={{ color: "#8b5cf6", fontWeight: 600, textDecoration: "none" }}>Se connecter</Link>
        </p>

        <AuthFormWorkie mode="signup" action={signUp} googleAction={signInWithGoogle} />
      </div>
    </main>
  );
}
