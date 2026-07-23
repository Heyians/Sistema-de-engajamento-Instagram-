import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const topics = await db.topic.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ topics });
}

const schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe um título para o tópico." }, { status: 400 });
  }

  const topic = await db.topic.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description,
      source: "manual",
    },
  });

  return NextResponse.json({ topic });
}
