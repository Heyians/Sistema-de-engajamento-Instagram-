import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { generateWeeklyPlan, AIConfigError } from "@/lib/ai";
import { getCurrentWeekStart } from "@/lib/constants";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const url = new URL(request.url);
  const weekStart = url.searchParams.get("weekStart") ?? getCurrentWeekStart();

  const items = await db.routineItem.findMany({
    where: { userId, weekStart },
    include: { topic: true, contentPiece: true },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ weekStart, items });
}

const schema = z.object({ weekStart: z.string().optional() });

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  const weekStart = parsed.success && parsed.data.weekStart ? parsed.data.weekStart : getCurrentWeekStart();

  const existing = await db.routineItem.count({ where: { userId, weekStart } });
  if (existing > 0) {
    return NextResponse.json(
      { error: "Já existe uma rotina gerada para essa semana." },
      { status: 409 }
    );
  }

  const [doc, topics] = await Promise.all([
    db.positioningDocument.findUnique({ where: { userId } }),
    db.topic.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  if (!doc) {
    return NextResponse.json(
      { error: "Complete a entrevista de posicionamento antes de gerar a rotina." },
      { status: 400 }
    );
  }
  if (topics.length === 0) {
    return NextResponse.json(
      { error: "Cadastre pelo menos um tópico antes de gerar a rotina." },
      { status: 400 }
    );
  }

  try {
    const plan = await generateWeeklyPlan({
      niche: doc.niche,
      audience: doc.audience,
      topics: topics.map((t) => ({ title: t.title, description: t.description })),
    });

    const topicByTitle = new Map(topics.map((t) => [t.title.trim().toLowerCase(), t]));

    const items = await db.$transaction(
      plan.slice(0, 7).map((item) =>
        db.routineItem.create({
          data: {
            userId,
            weekStart,
            dayOfWeek: item.dayOfWeek,
            objective: item.objective,
            channel: item.channel,
            format: item.format,
            topicId: topicByTitle.get(item.topicTitle.trim().toLowerCase())?.id ?? null,
          },
          include: { topic: true, contentPiece: true },
        })
      )
    );

    return NextResponse.json({ weekStart, items });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Não foi possível gerar a rotina agora." },
      { status: 500 }
    );
  }
}
