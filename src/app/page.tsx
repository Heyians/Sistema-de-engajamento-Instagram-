import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-24 text-center">
      <span className="badge">Método + plataforma com IA</span>
      <h1 className="text-4xl tracking-tight sm:text-5xl">
        Sua expertise <span className="script-note text-[0.85em]">vira conteúdo</span> todos os dias
      </h1>
      <p className="max-w-xl text-lg text-(--ink-soft)">
        A IA te entrevista a fundo, transforma o que você sabe em um plano
        semanal e gera cada peça de conteúdo pronta — com formato, objetivo e
        CTA certos, em um clique.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/register" className="btn btn-primary px-6 py-3">
          Instalar meu sistema de conteúdo
        </Link>
        <Link href="/login" className="btn btn-secondary px-6 py-3">
          Já tenho conta
        </Link>
      </div>

      <ol className="mt-12 grid gap-4 text-left sm:grid-cols-2">
        {[
          ["1. Entrevista", "Um agente de IA extrai seu nicho, público, dores e tom de voz."],
          ["2. Posicionamento", "Isso vira um documento estruturado — seu \"cérebro\" de conteúdo."],
          ["3. Rotina semanal", "O planner cruza tópico × objetivo × canal × formato."],
          ["4. Gerar", "Cada item da semana vira roteiro, carrossel, stories ou artigo em 1 clique."],
        ].map(([title, desc]) => (
          <li key={title} className="card p-4">
            <p className="font-display text-sm">{title}</p>
            <p className="mt-1 text-sm text-(--ink-soft)">{desc}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
