# AI Maestro (MVP)

Sistema que transforma a expertise de um profissional em um plano de
conteúdo recorrente: um agente de IA entrevista o usuário, extrai um
documento de posicionamento, monta uma rotina semanal (tópico × objetivo ×
canal × formato) e gera cada peça de conteúdo pronta em um clique.

Este é o MVP: cobre entrevista → posicionamento → planner → geração de
conteúdo → pontes (CTAs) → análise semanal, com publicação manual (o
usuário copia o conteúdo gerado e publica no Instagram). Não inclui,
ainda, integração com a Instagram Graph API (publicação automática,
métricas automáticas, automação de comentário→DM) — ver "Próximos
passos" abaixo.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS v4)
- [Prisma](https://www.prisma.io) + PostgreSQL (ex: um projeto Supabase gratuito)
- Sessão própria via cookie httpOnly assinado com JWT (`jose`) + `bcryptjs`
  para senhas — sem depender de um provedor de auth externo
- [`@google/genai`](https://www.npmjs.com/package/@google/genai) (Gemini API)
  para o agente de entrevista, extração do posicionamento, planner semanal,
  gerador de conteúdo e diagnóstico de métricas

## Setup

```bash
npm install
cp .env.example .env   # preencha DATABASE_URL com a connection string do seu Postgres
npx prisma db push     # cria as tabelas no Postgres apontado por DATABASE_URL
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Precisa de um Postgres rápido para desenvolvimento? Um projeto gratuito no
[Supabase](https://supabase.com) ou [Neon](https://neon.tech) funciona — copie
a connection string (URI, com a senha) para `DATABASE_URL`.

### Variáveis de ambiente (`.env`)

| Variável            | Obrigatória | Descrição                                                                 |
| ------------------- | ----------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`      | sim         | Connection string do Postgres, ex: `postgresql://user:senha@host:5432/postgres` |
| `SESSION_SECRET`    | sim         | String longa e aleatória para assinar o cookie de sessão                   |
| `GEMINI_API_KEY`    | para os recursos de IA | Sem ela, entrevista/planner/gerador retornam erro 503 amigável em vez de quebrar |
| `AI_MODEL`          | não         | Modelo Gemini a usar (padrão: `gemini-3.1-flash-lite`)                     |

Sem `GEMINI_API_KEY`, toda a parte de cadastro, posicionamento manual,
tópicos e pontes (CTAs) funciona normalmente — só os recursos que chamam a
IA ficam bloqueados com uma mensagem clara.

## Fluxo do MVP

1. **Cadastro/login** (`/register`, `/login`)
2. **Entrevista** (`/onboarding`) — chat guiado pelo agente de IA; ao
   finalizar, extrai o documento de posicionamento e sugere tópicos de
   conteúdo
3. **Posicionamento** (`/positioning`) — editar nicho, público, tom de voz,
   dores, mitos, pilares, e gerenciar o banco de tópicos manualmente
4. **Rotina semanal** (`/dashboard`) — gera a semana (tópico × objetivo ×
   canal × formato) e permite gerar o conteúdo de cada dia em um clique
5. **Conteúdo** (`/content/[id]`) — editar gancho, corpo e CTA; copiar texto
   pronto para publicar
6. **Pontes** (`/bridges`) — cadastrar CTAs reais (keyword, quiz, link,
   agenda) usados pelo gerador de conteúdo
7. **Análise** (`/analytics`) — registrar alcance/salvamentos/cliques/
   comentários de cada peça e gerar um diagnóstico da semana (top/bottom 3
   + ações sugeridas)

## Modelo de dados

`User` → `PositioningDocument` (1:1), `InterviewMessage[]`, `Topic[]`,
`Bridge[]`, `RoutineItem[]` → `ContentPiece` (1:1) → `MetricEntry[]`.
Veja `prisma/schema.prisma` para o schema completo.

## Próximos passos (fora do escopo do MVP)

- Publicação direta no Instagram via Graph API (Reels, Carrossel, Stories)
- Puxar métricas automaticamente em vez de digitar manualmente
- Automação real de comentário→DM
- Multi-perfil (uma conta gerenciando vários nichos/clientes)
- Biblioteca visual de templates para os carrosséis
- A/B de ganchos e CTAs

## Deploy

Produção: https://sistema-de-engajamento-instagram.vercel.app
