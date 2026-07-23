import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import { fetchRecentMediaWithInsights } from "@/lib/instagram";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const connection = await db.instagramConnection.findUnique({ where: { userId } });
  if (!connection) {
    return NextResponse.json(
      { error: "Conecte sua conta do Instagram primeiro." },
      { status: 400 }
    );
  }

  try {
    const media = await fetchRecentMediaWithInsights(connection.igUserId, connection.accessToken);

    const posts = await db.$transaction([
      ...media.map((m) =>
        db.instagramPost.upsert({
          where: { igMediaId: m.igMediaId },
          create: { userId, ...m },
          update: {
            caption: m.caption,
            mediaType: m.mediaType,
            permalink: m.permalink,
            postedAt: m.postedAt,
            reach: m.reach,
            likes: m.likes,
            comments: m.comments,
            saved: m.saved,
            shares: m.shares,
            syncedAt: new Date(),
          },
        })
      ),
      db.instagramConnection.update({ where: { userId }, data: { lastSyncedAt: new Date() } }),
    ]);

    return NextResponse.json({ posts: posts.slice(0, -1) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Não foi possível sincronizar com o Instagram." },
      { status: 502 }
    );
  }
}
