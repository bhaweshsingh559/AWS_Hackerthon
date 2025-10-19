import { v4 as uuidv4 } from "uuid";
import { callBedrock } from "../services/bedrockService.js";
import { logIncident } from "../services/dynamoService.js";
import { publishAlertIfNeeded } from "../services/alertService.js";
import { logger } from "../utils/logger.js";

function normalizeLocation(loc) {
  if (!loc || typeof loc !== "object") return null;
  const { lat, lon, latitude, longitude } = loc;
  const la = lat ?? latitude;
  const lo = lon ?? longitude;
  if (la == null || lo == null) return null;
  const latNum = Number(la);
  const lonNum = Number(lo);
  if (Number.isNaN(latNum) || Number.isNaN(lonNum)) return null;
  return { lat: latNum, lon: lonNum };
}

export async function analyzeSymptoms(req, res, next) {
  try {
    const { text, vitals } = req.body || {};
    const rawLocation = req.body?.location || null;
    const location = normalizeLocation(rawLocation);
    const userId = req.user ? (req.user.UserId || req.user.userId) : null;

    if (!text || typeof text !== "string") return res.status(400).json({ success: false, error: "text is required" });

    const prompt = buildAnalyzePrompt(text, vitals);
    const result = await callBedrock(prompt); // replace stub with real Bedrock invocation
    const parsed = result.parsed || result.fallback || {
      severity: "UNKNOWN",
      instructions: [String(result.raw || "Unable to parse model output.")],
      triggerAlert: false,
      alertMessage: "",
      reasoning: String(result.raw || "No model output")
    };

    const incidentId = uuidv4();

    try {
      await logIncident({ incidentId, text, parsed, location, userId });
    } catch (e) {
      logger.warn("logIncident failed", e);
    }

    if (parsed.triggerAlert) {
      try {
        // attempt to send to user's saved emergency contacts if present in req.user
        const contacts = req.user?.EmergencyContacts ? JSON.parse(req.user.EmergencyContacts) : [];
        await publishAlertIfNeeded(parsed, { incidentId, originalText: text, location, contacts, userId });
      } catch (e) {
        logger.error("publishAlertIfNeeded failed", e);
      }
    }

    return res.json({ success: true, incidentId, result: parsed, raw: result.raw || null, usedModel: result.usedModel || null });
  } catch (err) {
    logger.error("analyzeSymptoms error", err);
    next(err);
  }
}

export async function assistantChat(req, res, next) {
  try {
    const { text } = req.body || {};
    const rawLocation = req.body?.location || null;
    const location = normalizeLocation(rawLocation);
    const userId = req.user ? (req.user.UserId || req.user.userId) : null;
    if (!text) return res.status(400).json({ success: false, error: "text is required" });

    const prompt = buildChatPrompt(text);
    const result = await callBedrock(prompt);
    const parsed = result.parsed || result.fallback || {
      severity: "UNKNOWN",
      instructions: [String(result.raw || "Unable to parse model output.")],
      triggerAlert: false,
      alertMessage: "",
      reasoning: String(result.raw || "No model output")
    };

    const incidentId = uuidv4();
    try { await logIncident({ incidentId, text, parsed, location, userId }); } catch (e) { logger.warn(e); }

    if (parsed.triggerAlert) {
      try {
        const contacts = req.user?.EmergencyContacts ? JSON.parse(req.user.EmergencyContacts) : [];
        await publishAlertIfNeeded(parsed, { incidentId, originalText: text, location, contacts, userId });
      } catch (e) { logger.error("publishAlertIfNeeded failed", e); }
    }

    return res.json({ success: true, incidentId, result: parsed, raw: result.raw || null, usedModel: result.usedModel || null });
  } catch (err) {
    logger.error("assistantChat error", err);
    next(err);
  }
}

function buildAnalyzePrompt(text, vitals) {
  const vitalsText = vitals ? ` Vitals: ${JSON.stringify(vitals)}.` : "";
  return `...PROMPT... User report: """${text}"""${vitalsText}`; // same strict JSON prompt as earlier
}

function buildChatPrompt(text) {
  return `...CHAT PROMPT... User asked: """${text}"""`;
}