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
      <div className="card flex flex-col gap-2 p-6">
        <h2 className="text-lg">Instagram</h2>
        <p className="text-sm text-(--ink-soft)">
          Conecte sua conta para puxar automaticamente o alcance, curtidas,
          comentários, salvamentos e compartilhamentos de todos os seus posts
          — não só os gerados aqui.
        </p>
        {feedback === "error" && (
          <p className="text-sm text-(--coral)">Não foi possível conectar. Tente novamente.</p>
        )}
        <a href="/api/instagram/connect" className="btn btn-primary mt-2 self-start">
          Conectar Instagram
        </a>
      </div>
    );
  }

  const totals = posts.reduce(
    (acc, p) => ({
      reach: acc.reach + p.reach,
      likes: acc.likes + p.likes,
      saved: acc.saved + p.saved,
    }),
    { reach: 0, likes: 0, saved: 0 }
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-(--cobalt) px-6 py-4">
        <div>
          <p className="font-display text-base text-(--cream)">
            {connection.username ? `@${connection.username}` : "Conta vinculada"}
          </p>
          <p className="text-xs text-(--cream)/75">
            {connection.lastSyncedAt
              ? `Sincronizado ${new Date(connection.lastSyncedAt).toLocaleString("pt-BR")}`
              : "Ainda não sincronizado"}
          </p>
        </div>
        <button
          onClick={sync}
          disabled={syncing}
          className="rounded-full bg-(--cream) px-4 py-2 text-sm font-medium text-(--cobalt) disabled:opacity-50"
        >
          {syncing ? "Sincronizando…" : "Sincronizar agora"}
        </button>
      </div>

      <div className="flex flex-col gap-4 p-6">
        {posts.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-tile">
              <span className="stat-label">Alcance total</span>
              <span className="stat-value">{totals.reach.toLocaleString("pt-BR")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Curtidas</span>
              <span className="stat-value">{totals.likes.toLocaleString("pt-BR")}</span>
            </div>
            <div className="stat-tile">
              <span className="stat-label">Salvamentos</span>
              <span className="stat-value">{totals.saved.toLocaleString("pt-BR")}</span>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-(--coral)">{error}</p>}
        {feedback === "connected" && posts.length === 0 && (
          <p className="text-sm text-(--ink-soft)">
            Conectado! Clique em &ldquo;Sincronizar agora&rdquo; para puxar seus posts.
          </p>
        )}

        {posts.length > 0 && (
          <div className="flex flex-col gap-2">
            {posts.map((p) => (
              <a
                key={p.id}
                href={p.permalink}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-2 rounded-2xl border border-(--line) p-3.5 text-sm hover:border-(--cobalt)"
              >
                <p className="line-clamp-2 text-(--ink-soft)">{p.caption ?? "(sem legenda)"}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="badge">{p.mediaType}</span>
                  <span className="badge">{new Date(p.postedAt).toLocaleDateString("pt-BR")}</span>
                  <span className="badge">alcance {p.reach}</span>
                  <span className="badge">curtidas {p.likes}</span>
                  <span className="badge">comentários {p.comments}</span>
                  <span className="badge">salvos {p.saved}</span>
                  <span className="badge">compart. {p.shares}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-(--line) pt-4">
          <button
            onClick={runAdvice}
            disabled={loadingAdvice || posts.length === 0}
            className="btn btn-primary self-start"
          >
            {loadingAdvice ? "Analisando…" : "Gerar conselho do dia"}
          </button>
          {advice && (
            <div className="rounded-2xl bg-(--butter)/50 p-4 text-sm">
              <p className="script-note mb-2 text-lg">conselho do dia</p>
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
    </div>
  );
}
