import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import BridgesManager from "@/components/BridgesManager";

export default async function BridgesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const bridges = await db.bridge.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl">Pontes (CTAs reais)</h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Cadastre os destinos reais (palavra-chave, quiz, link, agenda). O
          gerador de conteúdo gira entre as pontes ativas, usando a que ficou
          mais tempo sem ser escolhida.
        </p>
      </div>

      <BridgesManager
        initial={bridges.map((b) => ({
          id: b.id,
          type: b.type,
          label: b.label,
          destination: b.destination,
          active: b.active,
        }))}
      />
    </main>
  );
}
