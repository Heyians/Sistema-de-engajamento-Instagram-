import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const doc = await db.positioningDocument.findUnique({ where: { userId } });
  return NextResponse.json({ positioningDocument: doc });
}

const schema = z.object({
  niche: z.string().min(1),
  audience: z.string().min(1),
  toneOfVoice: z.string().min(1),
  painPoints: z.array(z.string()),
  mythsToDebunk: z.array(z.string()),
  contentPillars: z.array(z.string()),
});

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const data = parsed.data;
  const doc = await db.positioningDocument.upsert({
    where: { userId },
    create: {
      userId,
      niche: data.niche,
      audience: data.audience,
      toneOfVoice: data.toneOfVoice,
      painPoints: JSON.stringify(data.painPoints),
      mythsToDebunk: JSON.stringify(data.mythsToDebunk),
      contentPillars: JSON.stringify(data.contentPillars),
    },
    update: {
      niche: data.niche,
      audience: data.audience,
      toneOfVoice: data.toneOfVoice,
      painPoints: JSON.stringify(data.painPoints),
      mythsToDebunk: JSON.stringify(data.mythsToDebunk),
      contentPillars: JSON.stringify(data.contentPillars),
    },
  });

  return NextResponse.json({ positioningDocument: doc });
}
