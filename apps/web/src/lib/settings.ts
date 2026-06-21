import { prisma } from "./db";

export async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        platformName: "Intranet MYV",
        primaryColor: "#475569",
        accentColor: "#0f172a",
        emailProvider: "smtp",
      },
    });
  }
  return settings;
}
