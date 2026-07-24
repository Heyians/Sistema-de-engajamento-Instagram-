"use client";

import { useState } from "react";
import { OBJECTIVES } from "@/lib/constants";

interface Metric {
  reach: number;
  saves: number;
  clicks: number;
  comments: number;
}

interface Piece {
  routineItemId: string;
  contentPieceId: string;
  hook: string;
  objective: string;
  channel: string;
  format: string;
  topicTitle: string | null;
  metric: Metric | null;
}

interface RankedPiece extends Metric {
  hook: string;
  objective: string;
  channel: string;
  format: string;
  topicTitle: string | null;
  queenMetric: "reach" | "saves" | "clicks";
}

const METRIC_LABEL: Record<"reach" | "saves" | "clicks", string> = {
  reach: "alcance",
  saves: "salvamentos",
  clicks: "cliques",
};

function objectiveLabel(id: string) {
  return OBJECTIVES.find((o) => o.id === id)?.label ?? id;
}

function MetricRow({ piece, weekStart }: { piece: Piece; weekStart: string }) {
  const [reach, setReach] = useState(piece.metric?.reach ?? 0);
  const [saves, setSaves] = useState(piece.metric?.saves ?? 0);
  const [clicks, setClicks] = useState(piece.metric?.clicks ?? 0);
  const [comments, setComments] = useState(piece.metric?.comments ?? 0);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentPieceId: piece.contentPieceId,
          weekStart,
          reach,
          saves,
          clicks,
          comments,
        }),
      });
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  const num = "field w-20 px-2 py-1";

  return (
    <div className="card flex flex-col gap-2 p-3.5">
      <div className="text-sm">
        <span className="font-medium">{objectiveLabel(piece.objective)}</span>{" "}
        <span className="text-(--ink-soft)">
          · {piece.channel} · {piece.format}
        </span>
        <p className="mt-0.5 italic text-(--ink-soft)">&ldquo;{piece.hook}&rdquo;</p>
      </div>
      <div className="flex flex-wrap items-end gap-3 text-xs">
        <label className="flex flex-col gap-1">
          Alcance
          <input type="number" min={0} value={reach} onChange={(e) => setReach(+e.target.value)} className={num} />
        </label>
        <label className="flex flex-col gap-1">
          Salvamentos
          <input type="number" min={0} value={saves} onChange={(e) => setSaves(+e.target.value)} className={num} />
        </label>
        <label className="flex flex-col gap-1">
          Cliques (CTA)
          <input type="number" min={0} value={clicks} onChange={(e) => setClicks(+e.target.value)} className={num} />
        </label>
        <label className="flex flex-col gap-1">
          Comentários
          <input
            type="number"
            min={0}
            value={comments}
            onChange={(e) => setComments(+e.target.value)}
            className={num}
          />
        </label>
        <button onClick={save} disabled={saving} className="btn btn-secondary px-3 py-1.5 text-xs">
          {saving ? "Salvando…" : "Salvar"}
        </button>
        {savedAt && <span className="text-(--ink-soft)">Salvo.</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPanel({ weekStart, pieces }: { weekStart: string; pieces: Piece[] }) {
  const [diagnosis, setDiagnosis] = useState<{ summary: string; actions: string[] } | null>(null);
  const [top, setTop] = useState<RankedPiece[]>([]);
  const [bottom, setBottom] = useState<RankedPiece[]>([]);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDiagnosis() {
    setLoadingDiagnosis(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar diagnóstico.");
        return;
      }
      setDiagnosis(data.diagnosis);
      setTop(data.top);
      setBottom(data.bottom);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoadingDiagnosis(false);
    }
  }

  if (pieces.length === 0) {
    return (
      <p className="card p-6 text-sm text-(--ink-soft)">
        Nenhum conteúdo gerado ainda essa semana. Gere conteúdo na{" "}
        <a href="/dashboard" className="text-(--cobalt-deep) underline">
          rotina
        </a>{" "}
        antes de registrar números.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {pieces.map((p) => (
          <MetricRow key={p.contentPieceId} piece={p} weekStart={weekStart} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={runDiagnosis} disabled={loadingDiagnosis} className="btn btn-primary self-start">
          {loadingDiagnosis ? "Analisando…" : "Gerar diagnóstico da semana"}
        </button>
        {error && <p className="text-sm text-(--coral)">{error}</p>}

        {diagnosis && (
          <div className="card flex flex-col gap-4 p-4">
            <p className="text-sm">{diagnosis.summary}</p>
            <ul className="list-disc pl-5 text-sm">
              {diagnosis.actions.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Top 3</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-(--ink-soft)">
                  {top.map((t, idx) => (
                    <li key={idx}>
                      {idx + 1}. {t.hook} ({t.channel} · {METRIC_LABEL[t.queenMetric]}: {t[t.queenMetric]})
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Bottom 3</p>
                <ul className="mt-1 flex flex-col gap-1 text-sm text-(--ink-soft)">
                  {bottom.map((b, idx) => (
                    <li key={idx}>
                      {idx + 1}. {b.hook} ({b.channel} · {METRIC_LABEL[b.queenMetric]}: {b[b.queenMetric]})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
