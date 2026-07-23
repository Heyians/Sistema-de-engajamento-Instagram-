import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;
  const piece = await db.contentPiece.findUnique({
    where: { id },
    include: { routineItem: { include: { topic: true } } },
  });
  if (!piece || piece.userId !== userId) {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ contentPiece: piece });
}

const schema = z.object({
  hook: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().optional(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;
  const existing = await db.contentPiece.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Conteúdo não encontrado." }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const piece = await db.contentPiece.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ contentPiece: piece });
}
