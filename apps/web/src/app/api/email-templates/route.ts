import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { name, subject, body } = await req.json();

  if (!name || !subject) {
    return NextResponse.json({ error: "Nombre y asunto son requeridos" }, { status: 400 });
  }

  const template = await prisma.emailTemplate.create({
    data: { name, subject, body: body ?? "" },
  });

  return NextResponse.json(template, { status: 201 });
}
