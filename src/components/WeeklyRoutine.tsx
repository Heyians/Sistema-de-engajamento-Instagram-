"use client";

import { useState } from "react";
import Link from "next/link";
import { OBJECTIVES, WEEKDAYS } from "@/lib/constants";

interface RoutineItemView {
  id: string;
  dayOfWeek: number;
  objective: string;
  channel: string;
  format: string;
  status: string;
  topic: { title: string } | null;
  contentPiece: { id: string; hook: string } | null;
}

function objectiveMeta(id: string) {
  return OBJECTIVES.find((o) => o.id === id) ?? { label: id, emoji: "•" };
}

export default function WeeklyRoutine({
  weekStart,
  initialItems,
}: {
  weekStart: string;
  initialItems: RoutineItemView[];
}) {
  const [items, setItems] = useState(initialItems);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [generatingItemId, setGeneratingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generatePlan() {
    setGeneratingPlan(true);
    setError(null);
    try {
      const res = await fetch("/api/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar rotina.");
        return;
      }
      setItems(
        data.items.map((i: {
          id: string;
          dayOfWeek: number;
          objective: string;
          channel: string;
          format: string;
          status: string;
          topic: { title: string } | null;
          contentPiece: { id: string; hook: string } | null;
        }) => ({
          id: i.id,
          dayOfWeek: i.dayOfWeek,
          objective: i.objective,
          channel: i.channel,
          format: i.format,
          status: i.status,
          topic: i.topic ? { title: i.topic.title } : null,
          contentPiece: i.contentPiece
            ? { id: i.contentPiece.id, hook: i.contentPiece.hook }
            : null,
        }))
      );
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function generateContent(itemId: string) {
    setGeneratingItemId(itemId);
    setError(null);
    try {
      const res = await fetch(`/api/routine/${itemId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar conteúdo.");
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: "generated",
                contentPiece: { id: data.contentPiece.id, hook: data.contentPiece.hook },
              }
            : i
        )
      );
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setGeneratingItemId(null);
    }
  }

  async function markPublished(itemId: string) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: "published" } : i)));
    await fetch(`/api/routine/${itemId}/publish`, { method: "POST" });
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-black/10 p-6 dark:border-white/10">
        <p className="text-sm opacity-70">
          Nenhuma rotina gerada para essa semana ainda.
        </p>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          onClick={generatePlan}
          disabled={generatingPlan}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {generatingPlan ? "Gerando rotina…" : "Gerar rotina da semana"}
        </button>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {sorted.map((item) => {
        const objective = objectiveMeta(item.objective);
        return (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{WEEKDAYS[item.dayOfWeek] ?? "Dia"}</span>
              <span className="opacity-40">·</span>
              <span>
                {objective.emoji} {objective.label}
              </span>
              <span className="opacity-40">·</span>
              <span className="opacity-70">{item.channel}</span>
              <span className="opacity-40">·</span>
              <span className="opacity-70">{item.format}</span>
              {item.status === "published" && (
                <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                  Publicado
                </span>
              )}
            </div>
            {item.topic && <p className="text-sm opacity-80">Tópico: {item.topic.title}</p>}

            {item.contentPiece ? (
              <div className="mt-1 flex flex-col gap-2 rounded-md bg-black/5 p-3 dark:bg-white/5">
                <p className="text-sm italic">&ldquo;{item.contentPiece.hook}&rdquo;</p>
                <div className="flex gap-3 text-sm">
                  <Link href={`/content/${item.contentPiece.id}`} className="underline">
                    Ver / editar conteúdo
                  </Link>
                  {item.status !== "published" && (
                    <button
                      onClick={() => markPublished(item.id)}
                      className="opacity-70 hover:opacity-100"
                    >
                      Marcar como publicado
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => generateContent(item.id)}
                disabled={generatingItemId === item.id}
                className="self-start rounded-full border border-black/15 px-4 py-2 text-sm font-medium disabled:opacity-40 dark:border-white/15"
              >
                {generatingItemId === item.id ? "Gerando…" : "Gerar conteúdo"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
