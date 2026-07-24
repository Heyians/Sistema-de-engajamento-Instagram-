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
        <h2 className="text-lg">Banco de tópicos</h2>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Sementes de conteúdo usadas pelo planner semanal.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do tópico"
          className="field flex-1"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          className="field flex-1"
        />
        <button onClick={addTopic} disabled={saving || !title.trim()} className="btn btn-secondary">
          Adicionar
        </button>
      </div>

      {error && <p className="text-sm text-(--coral)">{error}</p>}

      <ul className="flex flex-col gap-2">
        {topics.map((t) => (
          <li key={t.id} className="card flex items-start justify-between gap-3 px-3.5 py-3 text-sm">
            <div>
              <p className="font-medium">{t.title}</p>
              {t.description && <p className="text-(--ink-soft)">{t.description}</p>}
              <p className="mt-0.5 text-xs text-(--ink-soft)">{t.source}</p>
            </div>
            <button
              onClick={() => removeTopic(t.id)}
              className="shrink-0 text-(--ink-soft) hover:text-(--coral)"
            >
              Remover
            </button>
          </li>
        ))}
        {topics.length === 0 && (
          <p className="text-sm text-(--ink-soft)">Nenhum tópico ainda.</p>
        )}
      </ul>
    </div>
  );
}
