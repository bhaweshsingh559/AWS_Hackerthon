// scripts/testTwilioSend.js
import dotenv from "dotenv";
dotenv.config();
import Twilio from "twilio";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, TWILIO_WHATSAPP_FROM } = process.env;
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  console.error("Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env");
  process.exit(1);
}
const client = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// put a recipient phone that has joined WhatsApp sandbox / or is verified with SMS sandbox
const TEST_PHONE = "+918736096388";

async function run() {
  try {
    if (TWILIO_FROM) {
      const sms = await client.messages.create({
        from: TWILIO_FROM,
        to: TEST_PHONE,
        body: "🚨 Test SMS from Rakshak backend"
      });
      console.log("SMS sent sid:", sms.sid);
    } else {
      console.log("TWILIO_FROM not configured — skipping SMS test");
    }

    if (TWILIO_WHATSAPP_FROM) {
      const wa = await client.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${TEST_PHONE}`,
        body: "🚨 Test WhatsApp from Rakshak backend"
      });
      console.log("WhatsApp sent sid:", wa.sid);
    } else {
      console.log("TWILIO_WHATSAPP_FROM not configured — skipping WhatsApp test");
    }
  } catch (err) {
    console.error("Twilio test failed:", err?.message || err);
    if (err?.response) console.error("Twilio response body:", err.response.data || err.response);
  }
}
run();