import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const schema = z.object({
  contentPieceId: z.string().min(1),
  weekStart: z.string().min(1),
  reach: z.coerce.number().int().min(0).default(0),
  saves: z.coerce.number().int().min(0).default(0),
  clicks: z.coerce.number().int().min(0).default(0),
  comments: z.coerce.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const piece = await db.contentPiece.findUnique({ where: { id: parsed.data.contentPieceId } });
  if (!piece || piece.userId !== userId) {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  const { contentPieceId, weekStart, reach, saves, clicks, comments } = parsed.data;

  const entry = await db.metricEntry.upsert({
    where: { contentPieceId_weekStart: { contentPieceId, weekStart } },
    create: { userId, contentPieceId, weekStart, reach, saves, clicks, comments },
    update: { reach, saves, clicks, comments },
  });

  return NextResponse.json({ metricEntry: entry });
}
