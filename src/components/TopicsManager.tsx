"use client";

import { useState } from "react";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  source: string;
}

export default function TopicsManager({ initialTopics }: { initialTopics: Topic[] }) {
  const [topics, setTopics] = useState(initialTopics);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addTopic() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao adicionar tópico.");
        return;
      }
      setTopics((prev) => [data.topic, ...prev]);
      setTitle("");
      setDescription("");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function removeTopic(id: string) {
    setTopics((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Banco de tópicos</h2>
        <p className="mt-1 text-sm opacity-70">
          Sementes de conteúdo usadas pelo planner semanal.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do tópico"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className="flex-1 rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40"
        />
        <button
          onClick={addTopic}
          disabled={saving || !title.trim()}
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-white/15"
        >
          Adicionar
        </button>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <ul className="flex flex-col gap-2">
        {topics.map((t) => (
          <li
            key={t.id}
            className="flex items-start justify-between gap-3 rounded-md border border-black/10 px-3 py-2 text-sm dark:border-white/10"
          >
            <div>
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="opacity-70">{t.description}</p>}
              <p className="mt-0.5 text-xs opacity-50">{t.source}</p>
            </div>
            <button
              onClick={() => removeTopic(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              Remover
            </button>
          </li>
        ))}
        {topics.length === 0 && (
          <p className="text-sm opacity-60">Nenhum tópico ainda.</p>
        )}
      </ul>
    </div>
  );
}
