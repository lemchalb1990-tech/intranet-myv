import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({
    id: user.id,
    rut: user.rut,
    name: user.name,
    email: user.email,
    role: user.role,
    settings: {
      platformName: settings.platformName,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      accentColor: settings.accentColor,
    },
  });
}
