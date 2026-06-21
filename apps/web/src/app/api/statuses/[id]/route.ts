import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, color, order } = body;

  const updated = await prisma.projectStatus.update({
    where: { id },
    data: {
      name: name ?? undefined,
      color: color ?? undefined,
      order: order ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const projectCount = await prisma.project.count({ where: { statusId: id } });
  if (projectCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar un estado con proyectos asignados" },
      { status: 409 }
    );
  }

  await prisma.projectStatus.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
