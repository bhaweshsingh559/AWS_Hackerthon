// scripts/testTwilioSendVerbose.js
import dotenv from "dotenv";
dotenv.config();
import Twilio from "twilio";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM,
  TWILIO_WHATSAPP_FROM,
  TEST_PHONE
} = process.env;

// helper to mask secrets in logs
function mask(s, keep = 4) {
  if (!s) return "<none>";
  if (s.length <= keep) return "****";
  return s.slice(0, keep) + "..." + s.slice(-keep);
}

console.log("=== Twilio verbose test ===");
console.log("Node:", process.version);
console.log("TWILIO_ACCOUNT_SID:", mask(TWILIO_ACCOUNT_SID));
console.log("TWILIO_AUTH_TOKEN:", mask(TWILIO_AUTH_TOKEN));
console.log("TWILIO_FROM (SMS):", TWILIO_FROM || "<none>");
console.log("TWILIO_WHATSAPP_FROM:", TWILIO_WHATSAPP_FROM || "<none>");
console.log("TEST_PHONE (overrideable via .env TEST_PHONE):", TEST_PHONE || "<none>");
console.log("");

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error("ERROR: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in .env");
  process.exit(2);
}

const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Choose recipient: prefer TEST_PHONE env, else fallback example (change as needed)
const RECIPIENT = TEST_PHONE || "+918736096388"; // change to a phone that is allowed in your sandbox/test account

async function trySend() {
  try {
    // Test SMS if TWILIO_FROM configured
    if (TWILIO_FROM) {
      console.log("Sending SMS ->", RECIPIENT, "from:", TWILIO_FROM);
      const sms = await client.messages.create({
        from: TWILIO_FROM,
        to: RECIPIENT,
        body: "🚨 Test SMS from Rakshak backend (verbose)."
      });
      console.log("SMS SENT. sid:", sms?.sid, "status:", sms?.status || "unknown");
      console.log("SMS full response:", JSON.stringify({
        sid: sms?.sid,
        status: sms?.status,
        to: sms?.to,
        from: sms?.from,
        dateCreated: sms?.dateCreated?.toString?.() || sms?.dateCreated
      }, null, 2));
    } else {
      console.log("Skipping SMS test — TWILIO_FROM not configured.");
    }

    // Test WhatsApp if TWILIO_WHATSAPP_FROM configured
    if (TWILIO_WHATSAPP_FROM) {
      // Twilio wants `to` as 'whatsapp:+<number>' usually
      const to = String(RECIPIENT).startsWith("whatsapp:") ? RECIPIENT : `whatsapp:${RECIPIENT}`;
      console.log("Sending WhatsApp ->", to, "from:", TWILIO_WHATSAPP_FROM);
      const wa = await client.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to,
        body: "🚨 Test WhatsApp from Rakshak backend (verbose)."
      });
      console.log("WhatsApp SENT. sid:", wa?.sid, "status:", wa?.status || "unknown");
      console.log("WhatsApp full response:", JSON.stringify({
        sid: wa?.sid,
        status: wa?.status,
        to: wa?.to,
        from: wa?.from,
        dateCreated: wa?.dateCreated?.toString?.() || wa?.dateCreated
      }, null, 2));
    } else {
      console.log("Skipping WhatsApp test — TWILIO_WHATSAPP_FROM not configured.");
    }

    console.log("\nDone. Check Twilio Message Logs for delivery details (console -> Monitor -> Logs -> Messaging).");
  } catch (err) {
    console.error("Twilio test failed:");
    // If axios-like response exists, show Twilio response body
    if (err?.response) {
      console.error("Response data:", err.response.data || err.response);
    }
    console.error(err?.message || err);
    process.exitCode = 3;
  }
}

trySend();