import twilio from "twilio";
import { logger } from "../utils/logger.js";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

const client = twilio(accountSid, authToken);

export async function sendWhatsAppAlert({ to, message, location }) {
  try {
    const locLink = location
      ? `\n📍 Location: https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}`
      : "";
    const body = `${message}${locLink}`;
    const resp = await client.messages.create({
      from: whatsappFrom,
      to: `whatsapp:${to}`,
      body,
    });
    logger.info("WhatsApp message sent", { to, sid: resp.sid });
    return { ok: true, sid: resp.sid };
  } catch (err) {
    logger.error("WhatsApp message failed", { to, error: err.message });
    return { ok: false, error: err.message };
  }
}