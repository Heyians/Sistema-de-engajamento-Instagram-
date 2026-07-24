import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import ContentEditor from "@/components/ContentEditor";
import { OBJECTIVES } from "@/lib/constants";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const piece = await db.contentPiece.findUnique({
    where: { id },
    include: { routineItem: { include: { topic: true } } },
  });

  if (!piece || piece.userId !== session.userId) notFound();

  const objective =
    OBJECTIVES.find((o) => o.id === piece.routineItem.objective)?.label ??
    piece.routineItem.objective;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl">{piece.routineItem.topic?.title ?? "Conteúdo"}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="badge">{objective}</span>
          <span className="badge">{piece.routineItem.channel}</span>
          <span className="badge">{piece.routineItem.format}</span>
        </div>
      </div>

      <ContentEditor
        id={piece.id}
        initial={{ hook: piece.hook, body: piece.body, cta: piece.cta ?? "" }}
      />
    </main>
  );
}
