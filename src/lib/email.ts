import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "./db";

async function getEmailConfig() {
  const settings = await prisma.settings.findFirst();
  return settings;
}

async function sendEmail(to: string, subject: string, html: string) {
  const config = await getEmailConfig();
  if (!config) return;

  if (config.emailProvider === "resend" && config.resendApiKey) {
    const resend = new Resend(config.resendApiKey);
    await resend.emails.send({
      from: config.resendFrom ?? "no-reply@intranet.cl",
      to,
      subject,
      html,
    });
  } else if (config.smtpHost && config.smtpUser && config.smtpPassword) {
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort ?? 587,
      secure: config.smtpSecure,
      auth: { user: config.smtpUser, pass: config.smtpPassword },
    });
    await transporter.sendMail({
      from: config.smtpFrom ?? config.smtpUser,
      to,
      subject,
      html,
    });
  }
}

function baseTemplate(platformName: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0f172a; padding: 24px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 18px; font-weight: 600; }
    .body { padding: 32px; color: #334155; font-size: 15px; line-height: 1.6; }
    .footer { padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>${platformName}</h1></div>
    <div class="body">${content}</div>
    <div class="footer">Este es un mensaje automático, por favor no responda este correo.</div>
  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(
  to: string,
  name: string,
  rut: string,
  password: string
) {
  const config = await getEmailConfig();
  const platform = config?.platformName ?? "Intranet MYV";
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "";

  await sendEmail(
    to,
    `Bienvenido a ${platform}`,
    baseTemplate(
      platform,
      `<p>Hola <strong>${name}</strong>,</p>
      <p>Tu cuenta en <strong>${platform}</strong> ha sido creada. Puedes acceder con las siguientes credenciales:</p>
      <p><strong>RUT:</strong> ${rut}<br/><strong>Contraseña:</strong> ${password}</p>
      <p>Accede al portal: <a href="${url}/login">${url}/login</a></p>
      <p>Te recomendamos guardar estas credenciales en un lugar seguro.</p>`
    )
  );
}

export async function sendDocumentRequestEmail(
  to: string,
  name: string,
  documentTitle: string,
  note?: string
) {
  const config = await getEmailConfig();
  const platform = config?.platformName ?? "Intranet MYV";
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "";

  await sendEmail(
    to,
    `Nuevo documento solicitado — ${platform}`,
    baseTemplate(
      platform,
      `<p>Hola <strong>${name}</strong>,</p>
      <p>Se te ha solicitado el siguiente documento:</p>
      <p><strong>${documentTitle}</strong></p>
      ${note ? `<p>Observación: ${note}</p>` : ""}
      <p>Ingresa al portal para subir el documento: <a href="${url}/portal/documentos">${url}/portal/documentos</a></p>`
    )
  );
}

export async function sendDocumentReviewEmail(
  to: string,
  name: string,
  documentTitle: string,
  approved: boolean,
  reviewNote?: string
) {
  const config = await getEmailConfig();
  const platform = config?.platformName ?? "Intranet MYV";
  const status = approved ? "aprobado" : "rechazado";

  await sendEmail(
    to,
    `Documento ${status} — ${platform}`,
    baseTemplate(
      platform,
      `<p>Hola <strong>${name}</strong>,</p>
      <p>Tu documento <strong>${documentTitle}</strong> ha sido <strong>${status}</strong>.</p>
      ${reviewNote ? `<p>Comentario: ${reviewNote}</p>` : ""}
      <p>Ingresa al portal para más detalles: <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/documentos">${process.env.NEXT_PUBLIC_APP_URL}/portal/documentos</a></p>`
    )
  );
}

export async function sendStatusChangeEmail(
  to: string,
  name: string,
  projectName: string,
  newStatus: string
) {
  const config = await getEmailConfig();
  const platform = config?.platformName ?? "Intranet MYV";

  await sendEmail(
    to,
    `Actualización de proyecto — ${platform}`,
    baseTemplate(
      platform,
      `<p>Hola <strong>${name}</strong>,</p>
      <p>El estado de tu proyecto <strong>${projectName}</strong> ha sido actualizado a: <strong>${newStatus}</strong>.</p>
      <p>Ingresa al portal para ver los detalles: <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal">${process.env.NEXT_PUBLIC_APP_URL}/portal</a></p>`
    )
  );
}
