import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AuthForm from "@/components/AuthForm";

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl">Criar conta</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-(--ink-soft)">
        Já tem conta?{" "}
        <Link href="/login" className="text-(--cobalt-deep) underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
