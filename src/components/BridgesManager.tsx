"use client";

import { useState } from "react";
import { BRIDGE_TYPES } from "@/lib/constants";

interface Bridge {
  id: string;
  type: string;
  label: string;
  destination: string;
  active: boolean;
}

export default function BridgesManager({ initial }: { initial: Bridge[] }) {
  const [bridges, setBridges] = useState(initial);
  const [type, setType] = useState<string>(BRIDGE_TYPES[0].id);
  const [label, setLabel] = useState("");
  const [destination, setDestination] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addBridge() {
    if (!label.trim() || !destination.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label, destination }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar ponte.");
        return;
      }
      setBridges((prev) => [data.bridge, ...prev]);
      setLabel("");
      setDestination("");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    setBridges((prev) => prev.map((b) => (b.id === id ? { ...b, active } : b)));
    await fetch(`/api/bridges/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
  }

  async function removeBridge(id: string) {
    setBridges((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/bridges/${id}`, { method: "DELETE" });
  }

  const field = "field";

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-col gap-2 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            {BRIDGE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome (ex: keyword GUIA)"
            className={`${field} flex-1`}
          />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destino (link, DM, agenda…)"
            className={`${field} flex-1`}
          />
        </div>
        <button
          onClick={addBridge}
          disabled={saving || !label.trim() || !destination.trim()}
          className="btn btn-primary self-start"
        >
          {saving ? "Salvando…" : "Adicionar ponte"}
        </button>
        {error && <p className="text-sm text-(--coral)">{error}</p>}
      </div>

      <ul className="flex flex-col gap-2">
        {bridges.map((b) => (
          <li key={b.id} className="card flex items-center justify-between gap-3 px-3.5 py-3 text-sm">
            <div>
              <p className="font-medium">
                {b.label}{" "}
                <span className="font-normal text-(--ink-soft)">
                  ({BRIDGE_TYPES.find((t) => t.id === b.type)?.label ?? b.type})
                </span>
              </p>
              <p className="text-(--ink-soft)">{b.destination}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <label className="flex items-center gap-1 text-xs text-(--ink-soft)">
                <input
                  type="checkbox"
                  checked={b.active}
                  onChange={(e) => toggleActive(b.id, e.target.checked)}
                />
                Ativa
              </label>
              <button onClick={() => removeBridge(b.id)} className="text-(--ink-soft) hover:text-(--coral)">
                Remover
              </button>
            </div>
          </li>
        ))}
        {bridges.length === 0 && <p className="text-sm text-(--ink-soft)">Nenhuma ponte cadastrada.</p>}
      </ul>
    </div>
  );
}
