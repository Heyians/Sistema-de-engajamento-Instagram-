import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
