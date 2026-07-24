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
    <header className="border-b border-(--line) bg-(--cream)">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-display flex items-baseline gap-1.5 text-lg text-(--ink)">
          AI Maestro
          <span className="badge">MVP</span>
        </Link>

        {user ? (
          <nav className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm">
            <Link href="/dashboard" className="rounded-full px-3 py-1.5 hover:bg-(--butter)">
              Rotina
            </Link>
            <Link href="/positioning" className="rounded-full px-3 py-1.5 hover:bg-(--butter)">
              Posicionamento
            </Link>
            <Link href="/bridges" className="rounded-full px-3 py-1.5 hover:bg-(--butter)">
              Pontes
            </Link>
            <Link href="/analytics" className="rounded-full px-3 py-1.5 hover:bg-(--butter)">
              Análise
            </Link>
            <span className="px-2 text-(--ink-soft)">{user.name}</span>
            <LogoutButton />
          </nav>
        ) : (
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-(--butter)">
              Entrar
            </Link>
            <Link href="/register" className="btn btn-primary">
              Começar agora
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
