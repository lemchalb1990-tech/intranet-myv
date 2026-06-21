import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const statuses = await prisma.projectStatus.findMany({
    orderBy: { order: "asc" },
  });
  return NextResponse.json(statuses);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, color, order } = body;

  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const status = await prisma.projectStatus.create({
    data: { name, color: color ?? "#94a3b8", order: order ?? 0 },
  });

  return NextResponse.json(status, { status: 201 });
}
