"use client";

import { useState } from "react";

interface PositioningData {
  niche: string;
  audience: string;
  toneOfVoice: string;
  painPoints: string[];
  mythsToDebunk: string[];
  contentPillars: string[];
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function PositioningEditor({ initial }: { initial: PositioningData }) {
  const [niche, setNiche] = useState(initial.niche);
  const [audience, setAudience] = useState(initial.audience);
  const [toneOfVoice, setToneOfVoice] = useState(initial.toneOfVoice);
  const [painPoints, setPainPoints] = useState(initial.painPoints.join("\n"));
  const [mythsToDebunk, setMythsToDebunk] = useState(initial.mythsToDebunk.join("\n"));
  const [contentPillars, setContentPillars] = useState(initial.contentPillars.join("\n"));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/positioning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          audience,
          toneOfVoice,
          painPoints: linesToArray(painPoints),
          mythsToDebunk: linesToArray(mythsToDebunk),
          contentPillars: linesToArray(contentPillars),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar.");
        return;
      }
      setSavedAt(Date.now());
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  const field = "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nicho
        <input value={niche} onChange={(e) => setNiche(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Público
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          rows={2}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tom de voz
        <textarea
          value={toneOfVoice}
          onChange={(e) => setToneOfVoice(e.target.value)}
          rows={2}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Dores (uma por linha)
        <textarea
          value={painPoints}
          onChange={(e) => setPainPoints(e.target.value)}
          rows={4}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Mitos a combater (um por linha)
        <textarea
          value={mythsToDebunk}
          onChange={(e) => setMythsToDebunk(e.target.value)}
          rows={4}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Pilares de conteúdo (um por linha)
        <textarea
          value={contentPillars}
          onChange={(e) => setContentPillars(e.target.value)}
          rows={3}
          className={field}
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar posicionamento"}
        </button>
        {savedAt && <span className="text-xs opacity-60">Salvo.</span>}
      </div>
    </div>
  );
}
