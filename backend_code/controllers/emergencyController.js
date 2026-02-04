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
    const parsed = result.parsed || result.fallback || {};
    const fallbackResponse = buildChatFallbackResponse(text);
    const responseText = parsed.response
      || parsed.answer
      || parsed.message
      || (Array.isArray(parsed.instructions) ? parsed.instructions.join(" ") : null)
      || (result.raw ? String(result.raw) : null)
      || "I'm sorry, I couldn't generate a response.";
    const finalResponse = result.usedModel === "local-fallback" ? fallbackResponse : responseText;

    const incidentId = uuidv4();
    try { await logIncident({ incidentId, text, parsed, location, userId }); } catch (e) { logger.warn(e); }

    if (parsed.triggerAlert) {
      try {
        const contacts = req.user?.EmergencyContacts ? JSON.parse(req.user.EmergencyContacts) : [];
        await publishAlertIfNeeded(parsed, { incidentId, originalText: text, location, contacts, userId });
      } catch (e) { logger.error("publishAlertIfNeeded failed", e); }
    }

    return res.json({
      success: true,
      incidentId,
      response: finalResponse,
      result: parsed,
      raw: result.raw || null,
      usedModel: result.usedModel || null,
    });
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
  return [
    "You are Rakshak AI, a calm safety assistant.",
    "Provide a thorough, practical response with clear steps, bullet points, and short headings.",
    "If this is medical or safety related, include: symptoms (if relevant), immediate steps, and when to call emergency services.",
    "Return JSON only with this shape:",
    '{"response":"<full response text>","followUps":["optional follow-up question 1","optional follow-up question 2"]}',
    `User asked: """${text}"""`,
  ].join("\n");
}

function buildChatFallbackResponse(text = "") {
  const normalized = text.toLowerCase();
  const mentionsHeartAttack = normalized.includes("heart attack") || normalized.includes("heartattack");
  const asksSymptoms = normalized.includes("symptom") || normalized.includes("sign");
  const asksSafety = normalized.includes("safe") || normalized.includes("what should") || normalized.includes("steps");

  if (mentionsHeartAttack && asksSymptoms) {
    return [
      "Here are the common symptoms of a heart attack — they can vary by person, and not everyone has the same signs.",
      "",
      "🚨 Heart Attack Symptoms",
      "Most common:",
      "• Chest pain or discomfort (pressure, squeezing, fullness) in the center or left chest",
      "• Pain spreading to the arm (often left), shoulder, neck, jaw, or back",
      "• Shortness of breath (with or without chest pain)",
      "",
      "Other possible symptoms:",
      "• Cold sweat",
      "• Nausea or vomiting",
      "• Lightheadedness or dizziness",
      "• Unusual fatigue",
      "• Indigestion or heartburn-like feeling",
      "",
      "Symptoms often seen in women (but can happen to anyone):",
      "• Jaw, neck, shoulder, or upper back pain",
      "• Nausea",
      "• Shortness of breath",
      "• Extreme tiredness without a clear reason",
      "",
      "⚠️ What to do",
      "If symptoms last more than a few minutes or keep coming back:",
      "• Call emergency services immediately (do not drive yourself)",
      "• Keep the person still and monitor breathing",
      "• Chew aspirin only if advised by emergency services and not allergic",
      "",
      "If you want, tell me what symptoms you’re seeing and I can help you think through next steps.",
    ].join("\n");
  }

  if (mentionsHeartAttack && asksSafety) {
    return [
      "If someone may be having a heart attack, act quickly and keep things calm.",
      "",
      "✅ Immediate steps",
      "• Call emergency services right away",
      "• Keep the person still and seated or lying down",
      "• Loosen tight clothing and keep them warm",
      "• Monitor breathing and consciousness",
      "",
      "⚠️ If they become unresponsive",
      "• Call emergency services (if not already)",
      "• Start CPR if you are trained",
      "",
      "Tell me the person’s age, symptoms, and how long it has been happening, and I can guide you further.",
    ].join("\n");
  }

  if (mentionsHeartAttack) {
    return [
      "Heart attack concerns should be treated as urgent.",
      "",
      "⚠️ What to do now",
      "• Call emergency services immediately",
      "• Keep the person still and monitor breathing",
      "• Do not let them drive themselves",
      "",
      "If you can, describe the symptoms and how long they’ve lasted.",
    ].join("\n");
  }

  return [
    "I can help with emergency and safety guidance.",
    "Share what’s happening and I’ll give step-by-step advice.",
    "",
    "If anyone is in immediate danger, contact local emergency services right away.",
  ].join("\n");
}
