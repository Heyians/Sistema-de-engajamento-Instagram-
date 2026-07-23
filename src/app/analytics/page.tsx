import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getCurrentWeekStart } from "@/lib/constants";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import InstagramPanel from "@/components/InstagramPanel";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ instagram_connected?: string; instagram_error?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const feedback = params.instagram_connected ? "connected" : params.instagram_error ? "error" : null;

  const weekStart = getCurrentWeekStart();

  const [items, connection, instagramPosts] = await Promise.all([
    db.routineItem.findMany({
      where: { userId: session.userId, weekStart, contentPiece: { isNot: null } },
      include: {
        topic: true,
        contentPiece: { include: { metrics: { where: { weekStart } } } },
      },
      orderBy: { dayOfWeek: "asc" },
    }),
    db.instagramConnection.findUnique({ where: { userId: session.userId } }),
    db.instagramPost.findMany({
      where: { userId: session.userId },
      orderBy: { postedAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Análise da semana</h1>
        <p className="mt-1 text-sm opacity-70">
          Registre alcance, salvamentos, cliques e comentários de cada peça
          publicada. O ritual leva ~15 minutos.
        </p>
      </div>

      <InstagramPanel
        connection={
          connection
            ? {
                username: connection.username,
                lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
              }
            : null
        }
        initialPosts={instagramPosts.map((p) => ({
          id: p.id,
          caption: p.caption,
          mediaType: p.mediaType,
          permalink: p.permalink,
          postedAt: p.postedAt.toISOString(),
          reach: p.reach,
          likes: p.likes,
          comments: p.comments,
          saved: p.saved,
          shares: p.shares,
        }))}
        feedback={feedback}
      />

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
