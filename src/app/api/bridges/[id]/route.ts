import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

const schema = z.object({ active: z.boolean() });

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;
  const bridge = await db.bridge.findUnique({ where: { id } });
  if (!bridge || bridge.userId !== userId) {
    return NextResponse.json({ error: "Ponte não encontrada." }, { status: 404 });
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const updated = await db.bridge.update({ where: { id }, data: { active: parsed.data.active } });
  return NextResponse.json({ bridge: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;
  const bridge = await db.bridge.findUnique({ where: { id } });
  if (!bridge || bridge.userId !== userId) {
    return NextResponse.json({ error: "Ponte não encontrada." }, { status: 404 });
  }

  await db.bridge.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
