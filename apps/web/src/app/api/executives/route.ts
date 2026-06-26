import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const executives = await prisma.user.findMany({
    where: { role: "EXECUTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignedClients: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(executives);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email: email.trim().toLowerCase(), password: hashed, role: "EXECUTIVE" },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese email" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
