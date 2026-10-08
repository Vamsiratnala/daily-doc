import "server-only";
import { prisma } from "./db";

const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** Normalises Indian numbers to E.164 without "+", e.g. 9876543210 -> 919876543210. */
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

/**
 * Sends a WhatsApp text via the Cloud API. When credentials are missing the
 * message is logged instead, so bookings never fail because of WhatsApp.
 * Note: outside the 24h customer-service window Meta requires an approved
 * template; set WHATSAPP_TEMPLATE to send a template instead of free text.
 */
export async function sendWhatsApp(to: string | null | undefined, body: string) {
  if (!to) return;
  const phone = normalizePhone(to);
  if (!whatsappConfigured()) {
    await prisma.notificationLog.create({ data: { channel: "WHATSAPP", to: phone, body, status: "SKIPPED", detail: "WhatsApp not configured" } });
    console.info(`[whatsapp:dry-run] to=${phone}\n${body}`);
    return;
  }
  const template = process.env.WHATSAPP_TEMPLATE;
  const payload = template
    ? {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" },
          components: [{ type: "body", parameters: [{ type: "text", text: body }] }],
        },
      }
    : { messaging_product: "whatsapp", to: phone, type: "text", text: { body } };
  try {
    const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const detail = await res.text();
    await prisma.notificationLog.create({
      data: { channel: "WHATSAPP", to: phone, body, status: res.ok ? "SENT" : "FAILED", detail: detail.slice(0, 1000) },
    });
  } catch (e) {
    await prisma.notificationLog.create({ data: { channel: "WHATSAPP", to: phone, body, status: "FAILED", detail: String(e) } });
  }
}
