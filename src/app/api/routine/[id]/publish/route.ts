import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;
  const item = await db.routineItem.findUnique({ where: { id } });
  if (!item || item.userId !== userId) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }

  const updated = await db.routineItem.update({
    where: { id },
    data: { status: "published" },
  });

  return NextResponse.json({ item: updated });
}
