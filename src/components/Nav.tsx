import Link from "next/link";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";

export default async function Nav() {
  const session = await getSession();
  const user = session
    ? await db.user.findUnique({ where: { id: session.userId }, select: { name: true } })
    : null;

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          AI Maestro <span className="text-xs font-normal opacity-60">MVP</span>
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Rotina
            </Link>
            <Link href="/positioning" className="hover:underline">
              Posicionamento
            </Link>
            <Link href="/bridges" className="hover:underline">
              Pontes
            </Link>
            <Link href="/analytics" className="hover:underline">
              Análise
            </Link>
            <span className="opacity-60">{user.name}</span>
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/login" className="hover:underline">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-foreground px-3 py-1.5 text-background"
            >
              Começar agora
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
