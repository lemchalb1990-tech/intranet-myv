import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const inmobiliarias = await prisma.inmobiliaria.findMany({
    include: {
      proyectos: { orderBy: { name: "asc" } },
      _count: { select: { proyectos: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(inmobiliarias);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { name, rut, address } = body;

  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const inmobiliaria = await prisma.inmobiliaria.create({
    data: { name, rut: rut ?? null, address: address ?? null },
  });

  return NextResponse.json(inmobiliaria, { status: 201 });
}
