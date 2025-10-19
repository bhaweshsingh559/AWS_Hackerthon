// services/alertService.js
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import Twilio from "twilio";
import { logger } from "../utils/logger.js";
import dotenv from 'dotenv'
dotenv.config()
const REGION = process.env.AWS_REGION || "us-east-1";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || process.env.SNS_TOPIC || "";
const client = new SNSClient({ region: REGION });

const TW_SID = process.env.TWILIO_ACCOUNT_SID ;
const TW_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TW_FROM = process.env.TWILIO_FROM_SMS
const TW_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

const twClient = (TW_SID && TW_TOKEN) ? Twilio(TW_SID, TW_TOKEN) : null;

logger.info("Twilio config", {
  hasCredentials: !!(TW_SID && TW_TOKEN),
  TW_FROM: !!TW_FROM,
  TW_WHATSAPP_FROM: !!TW_WHATSAPP_FROM
});
function makeMapsLink(location) {
  if (!location) return "";
  const lat = Number(location.lat ?? location.latitude);
  const lon = Number(location.lon ?? location.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function buildMessageWithLocation(baseMessage, location) {
  let msg = baseMessage || "Emergency alert!";
  const link = makeMapsLink(location);
  if (link) msg += `\n\n📍 Location: ${link}`;
  return msg;
}

async function sendSnsToTopic(topicArn, message, subject = "Emergency Alert") {
  const cmd = new PublishCommand({ TopicArn: topicArn, Message: message, Subject: subject });
  return client.send(cmd);
}

async function sendSnsToPhone(phoneNumber, message) {
  const cmd = new PublishCommand({ PhoneNumber: phoneNumber, Message: message });
  return client.send(cmd);
}

async function sendTwilioSms(to, body) {
  if (!twClient || !TW_FROM) throw new Error("Twilio SMS not configured");
  return twClient.messages.create({ from: TW_FROM, to, body });
}

async function sendTwilioWhatsapp(to, body) {
  if (!twClient || !TW_WHATSAPP_FROM) throw new Error("Twilio WhatsApp not configured");
  // Twilio expects 'to' like 'whatsapp:+919876543210'
  const toWithPrefix = String(to).startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  return twClient.messages.create({ from: TW_WHATSAPP_FROM, to: toWithPrefix, body });
}

export async function publishAlertIfNeeded(parsed, meta = {}) {
  try {
    if (!parsed || !parsed.triggerAlert) {
      logger.debug("publishAlertIfNeeded: triggerAlert false - skipping.");
      return null;
    }

    const baseMessage = parsed.alertMessage || `Emergency: ${meta.originalText || "unknown"}`;
    const message = buildMessageWithLocation(baseMessage, meta.location);
    const subject = meta.subject || "Emergency Alert";

    logger.info("publishAlertIfNeeded starting", {
      incidentId: meta.incidentId,
      contactsCount: Array.isArray(meta.contacts) ? meta.contacts.length : 0,
      snsTopicConfigured: !!SNS_TOPIC_ARN,
    });

    if (SNS_TOPIC_ARN) {
      try {
        logger.info("Publishing message to SNS Topic", { topicArn: SNS_TOPIC_ARN, incidentId: meta.incidentId });
        const r = await sendSnsToTopic(SNS_TOPIC_ARN, message, subject);
        logger.info("SNS topic publish succeeded", { messageId: r.MessageId });
      } catch (err) {
        logger.warn("SNS topic publish failed", { topicArn: SNS_TOPIC_ARN, err: err?.message || err });
      }
    }

    const contacts = Array.isArray(meta.contacts) ? meta.contacts : [];
    const results = [];

    for (const raw of contacts) {
      const phone = String(raw).trim();
      const contactResult = { phone, sns: null, twilioSms: null, twilioWhatsapp: null, errors: [] };
      logger.info("Attempting to notify contact", { phone, incidentId: meta.incidentId });

      try {
        const r = await sendSnsToPhone(phone, message);
        contactResult.sns = { messageId: r.MessageId };
        logger.info("SNS publish to phone succeeded", { phone, messageId: r.MessageId });
      } catch (err) {
        logger.warn("SNS publish to phone failed", { phone, err: err?.message || err });
        contactResult.errors.push({ channel: "sns", error: err?.message || String(err) });
      }

      if (twClient && TW_FROM) {
        try {
          const r2 = await sendTwilioSms(phone, message);
          contactResult.twilioSms = { sid: r2.sid };
          logger.info("Twilio SMS sent", { phone, sid: r2.sid });
        } catch (twErr) {
          logger.warn("Twilio SMS failed", { phone, err: twErr?.message || twErr });
          contactResult.errors.push({ channel: "twilio-sms", error: twErr?.message || String(twErr) });
        }
      } else {
        logger.debug("Twilio SMS not configured or missing TW_FROM", { phone });
      }

      if (twClient && TW_WHATSAPP_FROM) {
        try {
          const r3 = await sendTwilioWhatsapp(phone, message);
          contactResult.twilioWhatsapp = { sid: r3.sid };
          logger.info("Twilio WhatsApp sent", { phone, sid: r3.sid });
        } catch (waErr) {
          logger.warn("Twilio WhatsApp failed (non-blocking)", { phone, err: waErr?.message || waErr });
          contactResult.errors.push({ channel: "twilio-whatsapp", error: waErr?.message || String(waErr) });
        }
      } else {
        logger.debug("Twilio WhatsApp not configured or missing TW_WHATSAPP_FROM", { phone });
      }

      results.push(contactResult);
    }

    logger.info("publishAlertIfNeeded completed", { incidentId: meta.incidentId, resultsCount: results.length });
    return { results };
  } catch (err) {
    logger.error("publishAlertIfNeeded failed", { err: err?.message || err, stack: err?.stack });
    throw err;
  }
}

export async function publishCustomAlert({ incidentId, message, location, contacts = [] }) {
  const base = message || "SOS - user requested immediate help";
  const parsed = { alertMessage: base, triggerAlert: true };
  const meta = { incidentId, originalText: base, location, contacts };
  const results = await publishAlertIfNeeded(parsed, meta);
  return { success: true, preview: base + (location ? ` (${makeMapsLink(location)})` : ""), results };
}