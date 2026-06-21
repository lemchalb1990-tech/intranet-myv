import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const steps = await prisma.unitStep.findMany({
    where: { unidadId: id },
    include: {
      completedBy: { select: { name: true } },
      documents: { select: { id: true, title: true, status: true, fileUrl: true, fileName: true } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(steps);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, description, notifyEnabled, notifyTemplate } = body;

  if (!name) {
    return NextResponse.json({ error: "Nombre del paso requerido" }, { status: 400 });
  }

  const lastStep = await prisma.unitStep.findFirst({
    where: { unidadId: id },
    orderBy: { order: "desc" },
  });

  const step = await prisma.unitStep.create({
    data: {
      unidadId: id,
      order: (lastStep?.order ?? -1) + 1,
      name,
      description: description ?? null,
      notifyEnabled: notifyEnabled ?? false,
      notifyTemplate: notifyTemplate ?? null,
    },
    include: {
      completedBy: { select: { name: true } },
      documents: { select: { id: true, title: true, status: true, fileUrl: true, fileName: true } },
    },
  });

  return NextResponse.json(step, { status: 201 });
}
