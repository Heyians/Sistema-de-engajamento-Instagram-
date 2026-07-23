"use client";

import { useState } from "react";

interface ContentData {
  hook: string;
  body: string;
  cta: string;
}

export default function ContentEditor({ id, initial }: { id: string; initial: ContentData }) {
  const [hook, setHook] = useState(initial.hook);
  const [body, setBody] = useState(initial.body);
  const [cta, setCta] = useState(initial.cta);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/15 dark:focus:border-white/40";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/content/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook, body, cta }),
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

  async function handleCopy() {
    const full = [hook, body, cta].filter(Boolean).join("\n\n");
    await navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Gancho / abertura
        <textarea value={hook} onChange={(e) => setHook(e.target.value)} rows={2} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Conteúdo
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        CTA
        <textarea value={cta} onChange={(e) => setCta(e.target.value)} rows={2} className={field} />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={handleCopy}
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium dark:border-white/15"
        >
          {copied ? "Copiado!" : "Copiar texto completo"}
        </button>
        {savedAt && <span className="text-xs opacity-60">Salvo.</span>}
      </div>
    </div>
  );
}
