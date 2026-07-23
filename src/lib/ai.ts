import OpenAI from "openai";

export class AIConfigError extends Error {
  constructor() {
    super(
      "DEEPSEEK_API_KEY não configurada. Defina a variável de ambiente para usar os recursos de IA."
    );
    this.name = "AIConfigError";
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new AIConfigError();
  if (!client) client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
  return client;
}

function getModel(): string {
  return process.env.AI_MODEL || "deepseek-v4-flash";
}

// DeepSeek's v4 models think by default and burn max_tokens on reasoning_content
// before ever writing the answer; disabling it keeps replies within budget.
const NO_THINKING = { thinking: { type: "disabled" } };

async function complete(system: string, prompt: string, maxTokens = 1500): Promise<string> {
  const deepseek = getClient();
  const response = await deepseek.chat.completions.create({
    model: getModel(),
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    ...NO_THINKING,
  } as OpenAI.ChatCompletionCreateParamsNonStreaming);
  return response.choices[0]?.message?.content ?? "";
}

async function completeChat(
  system: string,
  history: { role: "user" | "assistant"; content: string }[],
  maxTokens = 800
): Promise<string> {
  const deepseek = getClient();
  const response = await deepseek.chat.completions.create({
    model: getModel(),
    max_tokens: maxTokens,
    messages: [{ role: "system", content: system }, ...history],
    ...NO_THINKING,
  } as OpenAI.ChatCompletionCreateParamsNonStreaming);
  return response.choices[0]?.message?.content ?? "";
}

function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
  if (start === -1 || end === -1) {
    throw new Error("A IA não retornou um JSON válido.");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

const INTERVIEW_SYSTEM_PROMPT = `Você é o agente de entrevista do AI Maestro, um sistema que transforma a expertise de um profissional em um plano de conteúdo.

Sua tarefa é conduzir uma entrevista curta e conversacional (estilo "desabafo estratégico guiado") para extrair:
1. Quem é o público (nicho, perfil, dores)
2. Frases literais/mitos que esse público repete
3. Histórias e casos reais que o profissional já viveu
4. Tom de voz da pessoa

Regras:
- Faça UMA pergunta de cada vez, curta e direta, em português do Brasil.
- Use o que a pessoa já respondeu para aprofundar (não repita perguntas genéricas).
- Depois de 6-10 trocas, quando já tiver material suficiente (nicho, público, pelo menos 2 dores/mitos e o tom de voz), diga explicitamente que a entrevista está completa e que a pessoa pode clicar em "Finalizar entrevista".
- Nunca gere o documento de posicionamento aqui, apenas conduza a conversa.`;

export async function interviewReply(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  if (history.length === 0) {
    return "Oi! Vamos montar o seu sistema de conteúdo. Me conta: quem procura você e qual problema essa pessoa quer resolver?";
  }
  return completeChat(INTERVIEW_SYSTEM_PROMPT, history, 400);
}

export interface PositioningExtraction {
  niche: string;
  audience: string;
  toneOfVoice: string;
  painPoints: string[];
  mythsToDebunk: string[];
  contentPillars: string[];
  topics: { title: string; description: string }[];
}

export async function extractPositioning(
  transcript: string
): Promise<PositioningExtraction> {
  const system = `Você extrai um documento de posicionamento estruturado a partir da transcrição de uma entrevista.
Responda APENAS com um JSON válido (sem texto antes ou depois), no formato:
{
  "niche": "string curta descrevendo o nicho",
  "audience": "descrição do público-alvo",
  "toneOfVoice": "descrição do tom de voz",
  "painPoints": ["dor 1", "dor 2", ...],
  "mythsToDebunk": ["mito 1", "mito 2", ...],
  "contentPillars": ["crescimento", "autoridade", "venda"],
  "topics": [{"title": "título curto do tópico", "description": "1-2 frases"}]
}
Gere entre 6 e 12 tópicos de conteúdo a partir das dores, mitos e histórias mencionadas.`;

  const text = await complete(system, `Transcrição da entrevista:\n\n${transcript}`, 2000);
  return extractJson<PositioningExtraction>(text);
}

export interface PlanItemDraft {
  dayOfWeek: number;
  objective: "crescimento" | "autoridade" | "venda";
  channel: string;
  format: string;
  topicTitle: string;
}

export async function generateWeeklyPlan(input: {
  niche: string;
  audience: string;
  topics: { title: string; description: string | null }[];
}): Promise<PlanItemDraft[]> {
  const system = `Você é o planner do AI Maestro. Monte uma rotina semanal de conteúdo (7 dias, um item por dia, dayOfWeek de 0=segunda a 6=domingo).
Cruze objetivo (crescimento, autoridade ou venda), canal (reels, carrossel, stories, post, artigo) e formato narrativo, escolhendo o tópico mais adequado da lista fornecida para cada dia. Não repita o mesmo tópico duas vezes na semana se houver tópicos suficientes. Varie objetivos e canais ao longo da semana.
Responda APENAS com um JSON array no formato:
[{"dayOfWeek": 0, "objective": "crescimento", "channel": "reels", "format": "Pergunta polêmica", "topicTitle": "..."}]`;

  const prompt = `Nicho: ${input.niche}\nPúblico: ${input.audience}\n\nTópicos disponíveis:\n${input.topics
    .map((t) => `- ${t.title}: ${t.description ?? ""}`)
    .join("\n")}`;

  const text = await complete(system, prompt, 1800);
  return extractJson<PlanItemDraft[]>(text);
}

export interface ContentDraft {
  hook: string;
  body: string;
  cta: string;
}

export async function generateContentPiece(input: {
  niche: string;
  audience: string;
  toneOfVoice: string;
  objective: string;
  channel: string;
  format: string;
  topicTitle: string;
  topicDescription?: string | null;
  bridge?: { type: string; label: string; destination: string } | null;
}): Promise<ContentDraft> {
  const system = `Você é o gerador de conteúdo do AI Maestro. Escreva UMA peça de conteúdo pronta para publicar, na voz e tom descritos, em português do Brasil.
Responda APENAS com um JSON no formato:
{"hook": "gancho/abertura forte", "body": "corpo do conteúdo formatado para o canal (ex: slides separados por \\n\\n para carrossel, roteiro com cortes para reels, texto corrido para artigo)", "cta": "call to action final"}
Regras por objetivo:
- crescimento: gancho forte, nunca vende, CTA de valor gratuito (ex: "comenta X que eu te mando").
- autoridade: profundidade, bastidor ou opinião; às vezes sem CTA explícito.
- venda: quebra objeção e leva para conversa (DM, agenda, link).`;

  const bridgeText = input.bridge
    ? `Ponte/CTA real a usar: tipo=${input.bridge.type}, "${input.bridge.label}" -> ${input.bridge.destination}`
    : "Nenhuma ponte cadastrada, use um CTA genérico coerente com o objetivo.";

  const prompt = `Nicho: ${input.niche}
Público: ${input.audience}
Tom de voz: ${input.toneOfVoice}
Objetivo: ${input.objective}
Canal: ${input.channel}
Formato narrativo: ${input.format}
Tópico: ${input.topicTitle} - ${input.topicDescription ?? ""}
${bridgeText}`;

  const text = await complete(system, prompt, 1200);
  return extractJson<ContentDraft>(text);
}

export interface AnalyticsDiagnosis {
  summary: string;
  actions: string[];
}

export async function generateAnalyticsDiagnosis(input: {
  top: { hook: string; channel: string; format: string; objective: string; reach: number; saves: number; clicks: number }[];
  bottom: { hook: string; channel: string; format: string; objective: string; reach: number; saves: number; clicks: number }[];
}): Promise<AnalyticsDiagnosis> {
  const system = `Você analisa os números da semana de um criador de conteúdo e devolve um diagnóstico curto e acionável.
Responda APENAS com um JSON no formato:
{"summary": "1-2 frases sobre o padrão da semana", "actions": ["ação prática 1", "ação prática 2", "ação prática 3"]}`;

  const prompt = `Top 3 da semana:\n${JSON.stringify(input.top, null, 2)}\n\nBottom 3 da semana:\n${JSON.stringify(
    input.bottom,
    null,
    2
  )}`;

  const text = await complete(system, prompt, 700);
  return extractJson<AnalyticsDiagnosis>(text);
}
