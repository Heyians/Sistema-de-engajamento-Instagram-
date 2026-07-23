import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { generateContentPiece, AIConfigError } from "@/lib/ai";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { id } = await context.params;

  const item = await db.routineItem.findUnique({
    where: { id },
    include: { topic: true, contentPiece: true },
  });
  if (!item || item.userId !== userId) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }
  if (item.contentPiece) {
    return NextResponse.json({ error: "Conteúdo já gerado para esse item." }, { status: 409 });
  }

  const doc = await db.positioningDocument.findUnique({ where: { userId } });
  if (!doc) {
    return NextResponse.json({ error: "Complete o posicionamento primeiro." }, { status: 400 });
  }

  const activeBridge = await db.bridge.findFirst({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
  });

  try {
    const draft = await generateContentPiece({
      niche: doc.niche,
      audience: doc.audience,
      toneOfVoice: doc.toneOfVoice,
      objective: item.objective,
      channel: item.channel,
      format: item.format,
      topicTitle: item.topic?.title ?? "tópico livre relacionado ao nicho",
      topicDescription: item.topic?.description,
      bridge: activeBridge
        ? { type: activeBridge.type, label: activeBridge.label, destination: activeBridge.destination }
        : null,
    });

    const [contentPiece] = await db.$transaction([
      db.contentPiece.create({
        data: {
          userId,
          routineItemId: item.id,
          hook: draft.hook,
          body: draft.body,
          cta: draft.cta,
          bridgeId: activeBridge?.id,
        },
      }),
      db.routineItem.update({ where: { id: item.id }, data: { status: "generated" } }),
    ]);

    return NextResponse.json({ contentPiece });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Não foi possível gerar o conteúdo agora." },
      { status: 500 }
    );
  }
}
