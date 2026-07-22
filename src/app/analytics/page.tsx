import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentWeekStart } from "@/lib/constants";
import AnalyticsPanel from "@/components/AnalyticsPanel";

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const weekStart = getCurrentWeekStart();

  const items = await db.routineItem.findMany({
    where: { userId: session.userId, weekStart, contentPiece: { isNot: null } },
    include: {
      topic: true,
      contentPiece: { include: { metrics: { where: { weekStart } } } },
    },
    orderBy: { dayOfWeek: "asc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Análise da semana</h1>
        <p className="mt-1 text-sm opacity-70">
          Registre alcance, salvamentos, cliques e comentários de cada peça
          publicada. O ritual leva ~15 minutos.
        </p>
      </div>

      <AnalyticsPanel
        weekStart={weekStart}
        pieces={items
          .filter((i) => i.contentPiece)
          .map((i) => ({
            routineItemId: i.id,
            contentPieceId: i.contentPiece!.id,
            hook: i.contentPiece!.hook,
            objective: i.objective,
            channel: i.channel,
            format: i.format,
            topicTitle: i.topic?.title ?? null,
            metric: i.contentPiece!.metrics[0]
              ? {
                  reach: i.contentPiece!.metrics[0].reach,
                  saves: i.contentPiece!.metrics[0].saves,
                  clicks: i.contentPiece!.metrics[0].clicks,
                  comments: i.contentPiece!.metrics[0].comments,
                }
              : null,
          }))}
      />
    </main>
  );
}
