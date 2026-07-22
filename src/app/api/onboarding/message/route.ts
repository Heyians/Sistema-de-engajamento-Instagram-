import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { interviewReply, AIConfigError } from "@/lib/ai";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let messages = await db.interviewMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length === 0) {
    const greeting = await interviewReply([]);
    const saved = await db.interviewMessage.create({
      data: { userId, role: "assistant", content: greeting },
    });
    messages = [saved];
  }

  return NextResponse.json({ messages });
}

const schema = z.object({ message: z.string().min(1).max(4000) });

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  }

  const previous = await db.interviewMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  await db.interviewMessage.create({
    data: { userId, role: "user", content: parsed.data.message },
  });

  const history = [
    ...previous.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: parsed.data.message },
  ];

  try {
    const reply = await interviewReply(history);
    const saved = await db.interviewMessage.create({
      data: { userId, role: "assistant", content: reply },
    });
    return NextResponse.json({ message: saved });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Erro ao falar com a IA." }, { status: 500 });
  }
}
