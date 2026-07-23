import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { generateDailyAdvice, AIConfigError } from "@/lib/ai";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const [doc, posts] = await Promise.all([
    db.positioningDocument.findUnique({ where: { userId } }),
    db.instagramPost.findMany({
      where: { userId },
      orderBy: { postedAt: "desc" },
      take: 15,
    }),
  ]);

  if (!doc) {
    return NextResponse.json(
      { error: "Complete o posicionamento primeiro." },
      { status: 400 }
    );
  }
  if (posts.length === 0) {
    return NextResponse.json(
      { error: "Sincronize seus posts do Instagram primeiro." },
      { status: 400 }
    );
  }

  try {
    const advice = await generateDailyAdvice({
      niche: doc.niche,
      posts: posts.map((p) => ({
        caption: p.caption,
        mediaType: p.mediaType,
        daysAgo: Math.floor((Date.now() - p.postedAt.getTime()) / 86_400_000),
        reach: p.reach,
        likes: p.likes,
        comments: p.comments,
        saved: p.saved,
        shares: p.shares,
      })),
    });
    return NextResponse.json({ advice });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Não foi possível gerar o conselho agora." }, { status: 500 });
  }
}
