"use client";

import { useState } from "react";

interface Post {
  id: string;
  caption: string | null;
  mediaType: string;
  permalink: string;
  postedAt: string;
  reach: number;
  likes: number;
  comments: number;
  saved: number;
  shares: number;
}

interface Connection {
  username: string | null;
  lastSyncedAt: string | null;
}

export default function InstagramPanel({
  connection,
  initialPosts,
  feedback,
}: {
  connection: Connection | null;
  initialPosts: Post[];
  feedback: "connected" | "error" | null;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [syncing, setSyncing] = useState(false);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [advice, setAdvice] = useState<{ summary: string; actions: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao sincronizar.");
        return;
      }
      setPosts(data.posts);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSyncing(false);
    }
  }

  async function runAdvice() {
    setLoadingAdvice(true);
    setError(null);
    try {
      const res = await fetch("/api/instagram/advice", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar conselho.");
        return;
      }
      setAdvice(data.advice);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoadingAdvice(false);
    }
  }

  if (!connection) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold">Instagram</h2>
        <p className="text-sm opacity-70">
          Conecte sua conta para puxar automaticamente o alcance, curtidas,
          comentários, salvamentos e compartilhamentos de todos os seus posts
          — não só os gerados aqui.
        </p>
        {feedback === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Não foi possível conectar. Tente novamente.
          </p>
        )}
        <a
          href="/api/instagram/connect"
          className="mt-2 self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
        >
          Conectar Instagram
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Instagram</h2>
          <p className="text-sm opacity-70">
            Conectado como {connection.username ? `@${connection.username}` : "conta vinculada"}
            {connection.lastSyncedAt &&
              ` · última sincronização ${new Date(connection.lastSyncedAt).toLocaleString("pt-BR")}`}
          </p>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-white/15"
        >
          {syncing ? "Sincronizando…" : "Sincronizar agora"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {feedback === "connected" && posts.length === 0 && (
        <p className="text-sm opacity-70">Conectado! Clique em &ldquo;Sincronizar agora&rdquo; para puxar seus posts.</p>
      )}

      {posts.length > 0 && (
        <div className="flex flex-col gap-2">
          {posts.map((p) => (
            <a
              key={p.id}
              href={p.permalink}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1 rounded-md border border-black/10 p-3 text-sm hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
            >
              <p className="line-clamp-2 opacity-80">{p.caption ?? "(sem legenda)"}</p>
              <p className="text-xs opacity-60">
                {p.mediaType} · {new Date(p.postedAt).toLocaleDateString("pt-BR")} · alcance{" "}
                {p.reach} · curtidas {p.likes} · comentários {p.comments} · salvos {p.saved} ·
                compart. {p.shares}
              </p>
            </a>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-black/10 pt-4 dark:border-white/10">
        <button
          onClick={runAdvice}
          disabled={loadingAdvice || posts.length === 0}
          className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {loadingAdvice ? "Analisando…" : "Gerar conselho do dia"}
        </button>
        {advice && (
          <div className="rounded-lg bg-black/5 p-4 text-sm dark:bg-white/5">
            <p>{advice.summary}</p>
            <ul className="mt-2 list-disc pl-5">
              {advice.actions.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
