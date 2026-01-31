import { v4 as uuidv4 } from "uuid";
import { callBedrock } from "../services/bedrockService.js";
import { logIncident } from "../services/dynamoService.js";
import { publishAlertIfNeeded } from "../services/alertService.js";
import { logger } from "../utils/logger.js";
import { evaluateEmergencyText } from "../utils/emergencyDetection.js";

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

export async function detectEmergencyText(req, res, next) {
  try {
    const { text, source } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ success: false, error: "text is required" });
    }
    const result = evaluateEmergencyText(text);
    return res.json({
      success: true,
      result: {
        ...result,
        source: source || "unknown",
      },
    });
  } catch (err) {
    logger.error("detectEmergencyText error", err);
    next(err);
  }
}

const INCIDENT_CATEGORIES = ["medical", "accident", "fire", "crime", "unknown"];

function normalizeIncidentCategory(value) {
  if (!value) return "unknown";
  const normalized = String(value).toLowerCase().trim();
  if (INCIDENT_CATEGORIES.includes(normalized)) return normalized;
  if (["injury", "health", "illness", "cardiac"].includes(normalized)) return "medical";
  if (["crash", "collision", "traffic", "vehicle"].includes(normalized)) return "accident";
  if (["assault", "robbery", "theft", "violence"].includes(normalized)) return "crime";
  if (["burn", "smoke", "flames"].includes(normalized)) return "fire";
  return "unknown";
}

function fallbackIncidentClassification(text = "") {
  const lowered = text.toLowerCase();
  const matches = {
    medical: ["breathing", "chest pain", "heart", "stroke", "unconscious", "blood", "injury", "overdose"],
    accident: ["accident", "crash", "collision", "hit", "vehicle", "bike", "bus", "traffic"],
    fire: ["fire", "smoke", "burning", "flames", "explosion", "gas leak"],
    crime: ["assault", "robbery", "theft", "gun", "knife", "violence", "attack"],
  };

  for (const [category, keywords] of Object.entries(matches)) {
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      return {
        category,
        confidence: 0.62,
        reasoning: `Matched ${category} keyword(s) in the report.`,
        source: "keyword-fallback",
      };
    }
  }

  return {
    category: "unknown",
    confidence: 0.35,
    reasoning: "No classification keywords matched.",
    source: "keyword-fallback",
  };
}

function buildIncidentClassificationPrompt(text, context) {
  const contextText = context ? `Context: ${JSON.stringify(context)}.` : "";
  return [
    "Classify the incident into one category: medical, accident, fire, crime, unknown.",
    "Respond ONLY with JSON:",
    '{"category":"medical|accident|fire|crime|unknown","confidence":0.0,"reasoning":"short explanation"}',
    `User report: """${text}"""`,
    contextText,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function classifyIncident(req, res, next) {
  try {
    const { text, context } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ success: false, error: "text is required" });
    }

    const prompt = buildIncidentClassificationPrompt(text, context);
    const result = await callBedrock(prompt);
    const parsed = result.parsed || result.fallback || {};
    const normalizedCategory = normalizeIncidentCategory(parsed.category);
    const fallback = fallbackIncidentClassification(text);
    const category = normalizedCategory !== "unknown" ? normalizedCategory : fallback.category;

    return res.json({
      success: true,
      category,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : fallback.confidence,
      reasoning: parsed.reasoning || fallback.reasoning,
      source: normalizedCategory !== "unknown" ? "bedrock" : fallback.source,
      usedModel: result.usedModel || null,
      raw: result.raw || null,
    });
  } catch (err) {
    logger.error("classifyIncident error", err);
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
