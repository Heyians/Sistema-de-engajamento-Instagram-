import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;
  const topic = await db.topic.findUnique({ where: { id } });
  if (!topic || topic.userId !== userId) {
    return NextResponse.json({ error: "Tópico não encontrado." }, { status: 404 });
  }

  await db.topic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
