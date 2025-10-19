// services/bedrockService.js
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { logger } from "../utils/logger.js";
const REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || "us-east-1";
const MODEL_ID = process.env.BEDROCK_MODEL_ID || null;
const FALLBACK_MODEL_ID = process.env.BEDROCK_FALLBACK_MODEL || null;

function tryParseJson(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch (e) {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch (e2) {
        return null;
      }
    }
    return null;
  }
}


function fallbackParsedFromText(text) {
  const t = (text || "").toLowerCase();
  const severeWords = ["heart attack", "heart-attack", "heartattack", "chest pain", "unconscious", "not breathing", "no pulse", "cardiac"];
  const moderateWords = ["dizziness", "fever", "vomiting", "minor bleed", "broken", "fracture", "accident", "car crash", "accident happened"];
  const isSevere = severeWords.some(w => t.includes(w));
  const isModerate = moderateWords.some(w => t.includes(w));
  if (isSevere) {
    return {
      severity: "CRITICAL",
      instructions: ["Call emergency services immediately", "Keep the person still and monitor breathing"],
      triggerAlert: true,
      alertMessage: "Possible critical medical emergency — immediate help required.",
      reasoning: "Detected high-risk keywords in user report."
    };
  }
  if (isModerate) {
    return {
      severity: "SEVERE",
      instructions: ["Check airway and breathing", "If severe bleeding apply pressure and call for help"],
      triggerAlert: true,
      alertMessage: "Serious incident reported — please check and assist.",
      reasoning: "Detected accident/dizziness keywords."
    };
  }
  return {
    severity: "UNKNOWN",
    instructions: ["Gather more details and consider calling a doctor if symptoms worsen"],
    triggerAlert: false,
    alertMessage: "",
    reasoning: "Not enough information to trigger an alert."
  };
}

export async function callBedrock(prompt, options = {}) {
  const usedModel = MODEL_ID || FALLBACK_MODEL_ID || "none";
  let rawText = null;
  try {
    if (!MODEL_ID && !FALLBACK_MODEL_ID) {
      logger.info("Bedrock not configured: using local fallback parsing.");
      rawText = prompt;
      const parsed = fallbackParsedFromText(prompt);
      return { parsed, raw: rawText, usedModel: "local-fallback", fallback: parsed };
    }

    const model = MODEL_ID || FALLBACK_MODEL_ID;

    const client = new BedrockRuntimeClient({ region: REGION });

    const input = typeof prompt === "string" ? prompt : JSON.stringify(prompt);

    const contentType = "application/json";
    const accept = "application/json";

    const body = JSON.stringify({ input: input });

    const cmd = new InvokeModelCommand({
      modelId: model,
      body: new TextEncoder().encode(body),
      contentType,
      accept,
    });

    const resp = await client.send(cmd);
    const arr = await resp.body.transformToByteArray?.() || await streamToUint8Array(resp.body);
    rawText = new TextDecoder().decode(arr);

    const parsed = tryParseJson(rawText) || fallbackParsedFromText(rawText);

    return { parsed, raw: rawText, usedModel: model, fallback: parsed };
  } catch (err) {
    logger.error("callBedrock error", err);
    const parsed = fallbackParsedFromText(prompt);
    return { parsed, raw: err?.message || String(err), usedModel, fallback: parsed };
  }
}

async function streamToUint8Array(stream) {
  if (stream instanceof Uint8Array) return stream;
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}