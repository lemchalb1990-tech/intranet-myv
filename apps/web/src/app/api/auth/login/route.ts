import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";
import { normalizeRut, validateRut } from "@/lib/rut";

export async function POST(req: NextRequest) {
  try {
    const { rut, password } = await req.json();

    if (!rut || !password) {
      return NextResponse.json(
        { error: "RUT y contraseña son requeridos" },
        { status: 400 }
      );
    }

    if (!validateRut(rut)) {
      return NextResponse.json({ error: "RUT inválido" }, { status: 400 });
    }

    const normalized = normalizeRut(rut);
    const user = await prisma.user.findUnique({ where: { rut: normalized } });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.id, role: user.role, rut: user.rut });

    const response = NextResponse.json({
      role: user.role,
      name: user.name,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
