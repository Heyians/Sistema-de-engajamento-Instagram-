import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import PositioningEditor from "@/components/PositioningEditor";
import TopicsManager from "@/components/TopicsManager";

export default async function PositioningPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [doc, topics] = await Promise.all([
    db.positioningDocument.findUnique({ where: { userId: session.userId } }),
    db.topic.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!doc) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Você ainda não tem um posicionamento</h1>
        <p className="opacity-70">
          Faça a entrevista com o agente AI Maestro para gerar seu documento de
          posicionamento.
        </p>
        <Link
          href="/onboarding"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Ir para a entrevista
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Documento de posicionamento</h1>
        <p className="mt-1 text-sm opacity-70">
          Isso alimenta o planner e o gerador de conteúdo. Edite livremente.
        </p>
      </div>

      <PositioningEditor
        initial={{
          niche: doc.niche,
          audience: doc.audience,
          toneOfVoice: doc.toneOfVoice,
          painPoints: JSON.parse(doc.painPoints),
          mythsToDebunk: JSON.parse(doc.mythsToDebunk),
          contentPillars: JSON.parse(doc.contentPillars),
        }}
      />

      <TopicsManager
        initialTopics={topics.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          source: t.source,
        }))}
      />
    </main>
  );
}
