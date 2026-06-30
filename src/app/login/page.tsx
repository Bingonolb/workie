import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6">
      <h1 className="mb-8 text-3xl font-black">
        <span className="text-brand">Watch</span>Swap
      </h1>
      <AuthForm mode="login" action={signIn} />
    </main>
  );
}
