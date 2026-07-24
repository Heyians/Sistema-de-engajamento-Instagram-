"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/onboarding/message")
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
        if (data.error) setError(data.error);
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: text }]);
    setSending(true);

    try {
      const res = await fetch("/api/onboarding/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar mensagem.");
        return;
      }
      setMessages((prev) => [...prev, data.message]);
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setSending(false);
    }
  }

  async function finishInterview() {
    setFinishing(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/finish", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao finalizar entrevista.");
        return;
      }
      router.push("/positioning");
    } catch {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setFinishing(false);
    }
  }

  const userTurns = messages.filter((m) => m.role === "user").length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="card flex min-h-[24rem] flex-1 flex-col gap-3 overflow-y-auto p-4">
        {loadingHistory && <p className="text-sm text-(--ink-soft)">Carregando…</p>}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end rounded-br-md bg-(--cobalt) text-(--cream)"
                : "self-start rounded-bl-md bg-(--butter)"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && <p className="script-note self-start text-lg">o agente está pensando…</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-(--coral)">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva sua resposta…"
          className="field flex-1"
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn btn-primary">
          Enviar
        </button>
      </form>

      <button onClick={finishInterview} disabled={finishing || userTurns < 3} className="btn btn-secondary self-start">
        {finishing ? "Gerando posicionamento…" : "Finalizar entrevista"}
      </button>
      {userTurns < 3 && (
        <p className="text-xs text-(--ink-soft)">
          Responda pelo menos 3 perguntas para poder finalizar.
        </p>
      )}
    </div>
  );
}
