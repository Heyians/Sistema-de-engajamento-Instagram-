export const OBJECTIVES = [
  { id: "crescimento", label: "Crescimento", emoji: "📈" },
  { id: "autoridade", label: "Autoridade", emoji: "🏛️" },
  { id: "venda", label: "Venda", emoji: "💬" },
] as const;

export type ObjectiveId = (typeof OBJECTIVES)[number]["id"];

export const CHANNELS = [
  { id: "reels", label: "Reels / vídeo curto" },
  { id: "carrossel", label: "Carrossel" },
  { id: "stories", label: "Stories" },
  { id: "post", label: "Post estático" },
  { id: "artigo", label: "Artigo / blog" },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];

export const NARRATIVE_FORMATS = [
  "Mito vs. verdade",
  "Antes e depois",
  "Passo a passo",
  "Bastidor",
  "Lista rápida",
  "Pergunta polêmica",
  "Erro comum",
  "Estudo de caso / história de cliente",
  "Comparação",
  "Enquete / quiz interativo",
  "Depoimento",
  "Contraintuitivo",
  "Tutorial",
  "Confissão pessoal",
] as const;

export const BRIDGE_TYPES = [
  { id: "keyword", label: "Palavra-chave (comenta e recebe DM)" },
  { id: "quiz", label: "Quiz" },
  { id: "link", label: "Link / página" },
  { id: "agenda", label: "Agenda / agendamento" },
] as const;

export const WEEKDAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function getCurrentWeekStart(): string {
  return getMondayOfWeek(new Date());
}

export function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7; // 0=Mon..6=Sun, matching WEEKDAYS
}
