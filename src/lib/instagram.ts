export const IG_OAUTH_STATE_COOKIE = "ig_oauth_state";

export class InstagramConfigError extends Error {
  constructor() {
    super(
      "INSTAGRAM_APP_ID/INSTAGRAM_APP_SECRET não configuradas. Defina as variáveis de ambiente para conectar o Instagram."
    );
    this.name = "InstagramConfigError";
  }
}

function getCredentials() {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) throw new InstagramConfigError();
  return { appId, appSecret };
}

export async function exchangeCodeForShortLivedToken(code: string, redirectUri: string) {
  const { appId, appSecret } = getCredentials();
  const form = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_message ?? "Erro ao trocar o código de autorização por um token.");
  }
  return { accessToken: data.access_token as string, igUserId: String(data.user_id) };
}

export async function exchangeForLongLivedToken(shortLivedToken: string) {
  const { appSecret } = getCredentials();
  const url = new URL("https://graph.instagram.com/access_token");
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("access_token", shortLivedToken);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? "Erro ao gerar o token de longa duração.");
  }
  return { accessToken: data.access_token as string, expiresInSeconds: data.expires_in as number };
}

export async function fetchInstagramUsername(igUserId: string, accessToken: string) {
  const url = new URL(`https://graph.instagram.com/${igUserId}`);
  url.searchParams.set("fields", "username");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) return null;
  return (data.username as string) ?? null;
}

export interface InstagramMediaInsight {
  igMediaId: string;
  caption: string | null;
  mediaType: string;
  permalink: string;
  postedAt: Date;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  shares: number;
}

function metricValue(insightsData: { data?: { name: string; values?: { value: number }[] }[] }, name: string) {
  return insightsData.data?.find((m) => m.name === name)?.values?.[0]?.value ?? 0;
}

export async function fetchRecentMediaWithInsights(
  igUserId: string,
  accessToken: string,
  limit = 25
): Promise<InstagramMediaInsight[]> {
  const mediaUrl = new URL(`https://graph.instagram.com/${igUserId}/media`);
  mediaUrl.searchParams.set("fields", "id,caption,media_type,permalink,timestamp");
  mediaUrl.searchParams.set("access_token", accessToken);
  mediaUrl.searchParams.set("limit", String(limit));

  const mediaRes = await fetch(mediaUrl);
  const mediaData = await mediaRes.json();
  if (!mediaRes.ok) {
    throw new Error(mediaData.error?.message ?? "Erro ao buscar as publicações do Instagram.");
  }

  const items: { id: string; caption?: string; media_type: string; permalink: string; timestamp: string }[] =
    mediaData.data ?? [];

  return Promise.all(
    items.map(async (item) => {
      const insightsUrl = new URL(`https://graph.instagram.com/${item.id}/insights`);
      insightsUrl.searchParams.set("metric", "reach,likes,comments,saved,shares");
      insightsUrl.searchParams.set("access_token", accessToken);

      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();
      // Some media types (e.g. carousels/stories) reject certain metrics; treat as zero rather than failing the whole sync.
      const safeInsights = insightsRes.ok ? insightsData : { data: [] };

      return {
        igMediaId: item.id,
        caption: item.caption ?? null,
        mediaType: item.media_type,
        permalink: item.permalink,
        postedAt: new Date(item.timestamp),
        reach: metricValue(safeInsights, "reach"),
        likes: metricValue(safeInsights, "likes"),
        comments: metricValue(safeInsights, "comments"),
        saved: metricValue(safeInsights, "saved"),
        shares: metricValue(safeInsights, "shares"),
      };
    })
  );
}
