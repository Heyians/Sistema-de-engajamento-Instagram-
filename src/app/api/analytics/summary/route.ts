import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { generateAnalyticsDiagnosis, AIConfigError } from "@/lib/ai";
import { getCurrentWeekStart } from "@/lib/constants";

async function loadRanked(userId: string, weekStart: string) {
  const items = await db.routineItem.findMany({
    where: { userId, weekStart, contentPiece: { isNot: null } },
    include: {
      topic: true,
      contentPiece: { include: { metrics: { where: { weekStart } } } },
    },
  });

  const ranked = items
    .filter((i) => i.contentPiece)
    .map((i) => {
      const metric = i.contentPiece!.metrics[0];
      const reach = metric?.reach ?? 0;
      const saves = metric?.saves ?? 0;
      const clicks = metric?.clicks ?? 0;
      const comments = metric?.comments ?? 0;
      const score = reach + saves * 3 + clicks * 5 + comments * 2;
      return {
        routineItemId: i.id,
        contentPieceId: i.contentPiece!.id,
        hook: i.contentPiece!.hook,
        objective: i.objective,
        channel: i.channel,
        format: i.format,
        topicTitle: i.topic?.title ?? null,
        reach,
        saves,
        clicks,
        comments,
        hasMetrics: !!metric,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return ranked;
}

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart") ?? getCurrentWeekStart();
  const ranked = await loadRanked(userId, weekStart);

  return NextResponse.json({
    weekStart,
    ranked,
    top: ranked.slice(0, 3),
    bottom: [...ranked].reverse().slice(0, 3),
  });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => ({}));
  const weekStart = json?.weekStart ?? getCurrentWeekStart();
  const ranked = await loadRanked(userId, weekStart);
  const withMetrics = ranked.filter((r) => r.hasMetrics);

  if (withMetrics.length < 2) {
    return NextResponse.json(
      { error: "Registre os números de pelo menos 2 conteúdos para gerar o diagnóstico." },
      { status: 400 }
    );
  }

  const top = withMetrics.slice(0, 3);
  const bottom = [...withMetrics].reverse().slice(0, 3);

  try {
    const diagnosis = await generateAnalyticsDiagnosis({ top, bottom });
    return NextResponse.json({ weekStart, top, bottom, diagnosis });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Não foi possível gerar o diagnóstico agora." }, { status: 500 });
  }
}
