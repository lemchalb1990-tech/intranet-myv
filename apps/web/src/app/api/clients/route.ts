import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { normalizeRut, validateRut, getDefaultPassword, formatRut } from "@/lib/rut";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const executiveId = searchParams.get("executiveId");

  const where: Record<string, unknown> = {};

  if (session.role === "EXECUTIVE") {
    where.executiveId = session.userId;
  } else if (executiveId) {
    where.executiveId = executiveId;
  }

  const clients = await prisma.client.findMany({
    where: {
      ...where,
      user: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { rut: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, rut: true, isActive: true } },
      executive: { select: { id: true, name: true } },
      projects: { include: { status: true } },
      _count: { select: { documents: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "CLIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, rut, email, phone, executiveId } = body;

    if (!name || !rut || !email) {
      return NextResponse.json(
        { error: "Nombre, RUT y email son requeridos" },
        { status: 400 }
      );
    }

    if (!validateRut(rut)) {
      return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
    }

    const normalized = normalizeRut(rut);
    const defaultPassword = getDefaultPassword(normalized);
    const hashed = await hashPassword(defaultPassword);

    const user = await prisma.user.create({
      data: {
        rut: normalized,
        name,
        email,
        password: hashed,
        role: "CLIENT",
        client: {
          create: {
            phone: phone ?? null,
            executiveId: executiveId ?? null,
          },
        },
      },
      include: { client: true },
    });

    try {
      await sendWelcomeEmail(email, name, formatRut(normalized), defaultPassword);
    } catch (emailErr) {
      console.error("Email error:", emailErr);
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const e = error as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese RUT o email" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
