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
  todayDayOfWeek,
  todayLabel,
}: {
  weekStart: string;
  initialItems: RoutineItemView[];
  todayDayOfWeek?: number;
  todayLabel?: string;
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
      <div className="card flex flex-col items-start gap-3 p-6">
        <p className="text-sm text-(--ink-soft)">
          Nenhuma rotina gerada para essa semana ainda.
        </p>
        {error && <p className="text-sm text-(--coral)">{error}</p>}
        <button onClick={generatePlan} disabled={generatingPlan} className="btn btn-primary">
          {generatingPlan ? "Gerando rotina…" : "Gerar rotina da semana"}
        </button>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const todayItem = sorted.find((i) => i.dayOfWeek === todayDayOfWeek);

  function renderCard(item: RoutineItemView, spotlight: boolean) {
    const objective = objectiveMeta(item.objective);
    return (
      <div
        key={`${spotlight ? "spotlight-" : ""}${item.id}`}
        className="card overflow-hidden"
      >
        {spotlight && (
          <div className="flex items-center justify-between bg-(--cobalt) px-4 py-2.5">
            <span className="font-display text-sm text-(--cream)">Hoje · {WEEKDAYS[item.dayOfWeek] ?? "Dia"}</span>
            {item.status === "published" && (
              <span className="badge badge-success">Publicado</span>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3 p-4">
          {!spotlight && (
            <div className="flex items-center justify-between">
              <span className="font-display text-sm">{WEEKDAYS[item.dayOfWeek] ?? "Dia"}</span>
              {item.status === "published" && <span className="badge badge-success">Publicado</span>}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <span className="badge">
              {objective.emoji} {objective.label}
            </span>
            <span className="badge">{item.channel}</span>
            <span className="badge">{item.format}</span>
          </div>

          {item.topic && <p className="text-sm text-(--ink-soft)">Tópico: {item.topic.title}</p>}

          {item.contentPiece ? (
            <div className="flex flex-col gap-2 rounded-2xl bg-(--butter)/50 p-3">
              <p className="text-sm italic">&ldquo;{item.contentPiece.hook}&rdquo;</p>
              <div className="flex gap-4 text-sm">
                <Link href={`/content/${item.contentPiece.id}`} className="text-(--cobalt-deep) underline">
                  Ver / editar conteúdo
                </Link>
                {item.status !== "published" && (
                  <button
                    onClick={() => markPublished(item.id)}
                    className="text-(--ink-soft) hover:text-(--ink)"
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
              className={spotlight ? "btn btn-primary self-start" : "btn btn-secondary self-start"}
            >
              {generatingItemId === item.id ? "Gerando…" : "Gerar conteúdo"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-(--coral)">{error}</p>}

      {todayItem && (
        <div className="flex flex-col gap-2">
          <h2 className="script-note text-lg">conteúdo de hoje, {todayLabel?.toLowerCase()}</h2>
          {renderCard(todayItem, true)}
        </div>
      )}

      <div className="flex flex-col gap-4">{sorted.map((item) => renderCard(item, false))}</div>
    </div>
  );
}
