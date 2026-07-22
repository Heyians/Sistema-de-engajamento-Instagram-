import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentWeekStart } from "@/lib/constants";
import WeeklyRoutine from "@/components/WeeklyRoutine";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [doc, topicsCount] = await Promise.all([
    db.positioningDocument.findUnique({ where: { userId: session.userId } }),
    db.topic.count({ where: { userId: session.userId } }),
  ]);

  if (!doc) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Vamos montar seu posicionamento</h1>
        <p className="opacity-70">
          Antes de gerar sua rotina de conteúdo, faça a entrevista com o agente
          AI Maestro.
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

  const weekStart = getCurrentWeekStart();
  const items = await db.routineItem.findMany({
    where: { userId: session.userId, weekStart },
    include: { topic: true, contentPiece: true },
    orderBy: { dayOfWeek: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Rotina da semana</h1>
        <p className="mt-1 text-sm opacity-70">
          Semana de {new Date(weekStart + "T00:00:00").toLocaleDateString("pt-BR")}
        </p>
        {topicsCount === 0 && (
          <p className="mt-2 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            Você ainda não tem tópicos cadastrados.{" "}
            <Link href="/positioning" className="underline">
              Adicione alguns
            </Link>{" "}
            antes de gerar a rotina.
          </p>
        )}
      </div>

      <WeeklyRoutine
        weekStart={weekStart}
        initialItems={items.map((i) => ({
          id: i.id,
          dayOfWeek: i.dayOfWeek,
          objective: i.objective,
          channel: i.channel,
          format: i.format,
          status: i.status,
          topic: i.topic ? { title: i.topic.title } : null,
          contentPiece: i.contentPiece ? { id: i.contentPiece.id, hook: i.contentPiece.hook } : null,
        }))}
      />
    </main>
  );
}
