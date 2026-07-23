import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { extractPositioning, AIConfigError } from "@/lib/ai";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const messages = await db.interviewMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  const userTurns = messages.filter((m) => m.role === "user").length;
  if (userTurns < 3) {
    return NextResponse.json(
      { error: "Continue a entrevista um pouco mais antes de finalizar." },
      { status: 400 }
    );
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Profissional" : "Agente"}: ${m.content}`)
    .join("\n");

  try {
    const extraction = await extractPositioning(transcript);

    const doc = await db.positioningDocument.upsert({
      where: { userId },
      create: {
        userId,
        niche: extraction.niche,
        audience: extraction.audience,
        toneOfVoice: extraction.toneOfVoice,
        painPoints: JSON.stringify(extraction.painPoints),
        mythsToDebunk: JSON.stringify(extraction.mythsToDebunk),
        contentPillars: JSON.stringify(extraction.contentPillars),
        rawTranscript: transcript,
      },
      update: {
        niche: extraction.niche,
        audience: extraction.audience,
        toneOfVoice: extraction.toneOfVoice,
        painPoints: JSON.stringify(extraction.painPoints),
        mythsToDebunk: JSON.stringify(extraction.mythsToDebunk),
        contentPillars: JSON.stringify(extraction.contentPillars),
        rawTranscript: transcript,
      },
    });

    if (extraction.topics?.length) {
      await db.topic.createMany({
        data: extraction.topics.map((t) => ({
          userId,
          title: t.title,
          description: t.description,
          source: "entrevista",
        })),
      });
    }

    return NextResponse.json({ positioningDocument: doc });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Não foi possível gerar o documento de posicionamento agora." },
      { status: 500 }
    );
  }
}
