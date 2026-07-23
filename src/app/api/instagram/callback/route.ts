import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/session";
import {
  IG_OAUTH_STATE_COOKIE,
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  fetchInstagramUsername,
} from "@/lib/instagram";

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.redirect(new URL("/login", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(IG_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(IG_OAUTH_STATE_COOKIE);

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(new URL("/analytics?instagram_error=state", request.url));
  }

  try {
    const redirectUri = new URL("/api/instagram/callback", request.url).toString();
    const { accessToken: shortLivedToken, igUserId } = await exchangeCodeForShortLivedToken(
      code,
      redirectUri
    );
    const { accessToken, expiresInSeconds } = await exchangeForLongLivedToken(shortLivedToken);
    const username = await fetchInstagramUsername(igUserId, accessToken);

    await db.instagramConnection.upsert({
      where: { userId },
      create: {
        userId,
        igUserId,
        username,
        accessToken,
        tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      },
      update: {
        igUserId,
        username,
        accessToken,
        tokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      },
    });

    return NextResponse.redirect(new URL("/analytics?instagram_connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/analytics?instagram_error=exchange", request.url));
  }
}
