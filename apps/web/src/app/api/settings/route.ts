import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { saveLogo } from "@/lib/storage";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json({
    ...settings,
    smtpPassword: settings.smtpPassword ? "••••••••" : null,
    resendApiKey: settings.resendApiKey ? "••••••••" : null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  let data: Record<string, unknown> = {};

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const logo = formData.get("logo") as File | null;

    if (logo) {
      const buffer = Buffer.from(await logo.arrayBuffer());
      const logoUrl = await saveLogo(buffer, logo.name);
      data.logoUrl = logoUrl;
    }

    for (const [key, value] of formData.entries()) {
      if (key !== "logo") data[key] = value;
    }
  } else {
    data = await req.json();
  }

  const settings = await getSettings();

  const smtpPassword =
    data.smtpPassword && data.smtpPassword !== "••••••••"
      ? (data.smtpPassword as string)
      : undefined;

  const resendApiKey =
    data.resendApiKey && data.resendApiKey !== "••••••••"
      ? (data.resendApiKey as string)
      : undefined;

  const updated = await prisma.settings.update({
    where: { id: settings.id },
    data: {
      platformName: (data.platformName as string) ?? undefined,
      primaryColor: (data.primaryColor as string) ?? undefined,
      accentColor: (data.accentColor as string) ?? undefined,
      logoUrl: (data.logoUrl as string) ?? undefined,
      emailProvider: (data.emailProvider as string) ?? undefined,
      smtpHost: (data.smtpHost as string) ?? undefined,
      smtpPort: data.smtpPort ? Number(data.smtpPort) : undefined,
      smtpSecure: data.smtpSecure !== undefined ? Boolean(data.smtpSecure) : undefined,
      smtpUser: (data.smtpUser as string) ?? undefined,
      smtpPassword: smtpPassword ?? undefined,
      smtpFrom: (data.smtpFrom as string) ?? undefined,
      resendApiKey: resendApiKey ?? undefined,
      resendFrom: (data.resendFrom as string) ?? undefined,
    },
  });

  return NextResponse.json({
    ...updated,
    smtpPassword: updated.smtpPassword ? "••••••••" : null,
    resendApiKey: updated.resendApiKey ? "••••••••" : null,
  });
}
