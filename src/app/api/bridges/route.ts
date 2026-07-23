import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { BRIDGE_TYPES } from "@/lib/constants";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const bridges = await db.bridge.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bridges });
}

const typeIds = BRIDGE_TYPES.map((t) => t.id) as [string, ...string[]];
const schema = z.object({
  type: z.enum(typeIds),
  label: z.string().min(1).max(120),
  destination: z.string().min(1).max(300),
});

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const bridge = await db.bridge.create({ data: { userId, ...parsed.data } });
  return NextResponse.json({ bridge });
}
