import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { stepId } = await params;
  const { name, description, notifyEnabled, notifyTemplate, order } = await req.json();

  const updated = await prisma.unitStep.update({
    where: { id: stepId },
    data: {
      name: name ?? undefined,
      description: description !== undefined ? description : undefined,
      notifyEnabled: notifyEnabled !== undefined ? notifyEnabled : undefined,
      notifyTemplate: notifyTemplate !== undefined ? notifyTemplate : undefined,
      order: order !== undefined ? order : undefined,
    },
    include: {
      completedBy: { select: { name: true } },
      documents: { select: { id: true, title: true, status: true, fileUrl: true, fileName: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { stepId } = await params;
  await prisma.unitStep.delete({ where: { id: stepId } });
  return NextResponse.json({ ok: true });
}
