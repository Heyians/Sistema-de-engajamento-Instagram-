import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentWeekStart, getTodayDayOfWeek, WEEKDAYS } from "@/lib/constants";
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
  const todayDayOfWeek = getTodayDayOfWeek();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const [items, instagramConnection, recentPosts] = await Promise.all([
    db.routineItem.findMany({
      where: { userId: session.userId, weekStart },
      include: { topic: true, contentPiece: true },
      orderBy: { dayOfWeek: "asc" },
    }),
    db.instagramConnection.findUnique({ where: { userId: session.userId } }),
    db.instagramPost.findMany({
      where: { userId: session.userId, postedAt: { gte: sevenDaysAgo } },
    }),
  ]);

  const publishedCount = items.filter((i) => i.status === "published").length;
  const igTotals = recentPosts.reduce(
    (acc, p) => ({
      reach: acc.reach + p.reach,
      likes: acc.likes + p.likes,
      comments: acc.comments + p.comments,
      saved: acc.saved + p.saved,
    }),
    { reach: 0, likes: 0, comments: 0, saved: 0 }
  );

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
          <p className="text-xs opacity-60">Publicado essa semana</p>
          <p className="text-xl font-semibold">{publishedCount}/7</p>
        </div>
        {instagramConnection ? (
          <>
            <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs opacity-60">Alcance (7 dias)</p>
              <p className="text-xl font-semibold">{igTotals.reach.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs opacity-60">Curtidas + comentários</p>
              <p className="text-xl font-semibold">
                {(igTotals.likes + igTotals.comments).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="rounded-lg border border-black/10 p-3 dark:border-white/10">
              <p className="text-xs opacity-60">Salvamentos</p>
              <p className="text-xl font-semibold">{igTotals.saved.toLocaleString("pt-BR")}</p>
            </div>
          </>
        ) : (
          <Link
            href="/analytics"
            className="col-span-3 flex items-center rounded-lg border border-dashed border-black/15 p-3 text-sm opacity-70 hover:opacity-100 dark:border-white/15"
          >
            Conecte o Instagram para ver alcance e engajamento reais aqui →
          </Link>
        )}
      </div>

      <WeeklyRoutine
        weekStart={weekStart}
        todayDayOfWeek={todayDayOfWeek}
        todayLabel={WEEKDAYS[todayDayOfWeek]}
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
