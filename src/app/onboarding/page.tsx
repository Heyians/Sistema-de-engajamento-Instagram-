import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import OnboardingChat from "@/components/OnboardingChat";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const existingDoc = await db.positioningDocument.findUnique({
    where: { userId: session.userId },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl">Agente AI Maestro</h1>
        <p className="mt-1 text-sm text-(--ink-soft)">
          Um desabafo estratégico guiado por IA: conte quem você atende, as dores
          reais e as frases que seus clientes repetem. Isso vira o seu documento
          de posicionamento.
        </p>
        {existingDoc && (
          <p className="mt-2 rounded-2xl bg-(--coral)/10 px-3 py-2 text-sm text-(--coral)">
            Você já tem um documento de posicionamento. Continuar a entrevista e
            finalizar novamente vai atualizá-lo.
          </p>
        )}
      </div>
      <OnboardingChat />
    </main>
  );
}
