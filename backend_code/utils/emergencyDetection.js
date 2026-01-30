const EMERGENCY_PHRASES = [
  "help help",
  "i can't breathe",
  "i cant breathe",
  "there's an accident",
  "there is an accident",
  "someone is unconscious",
  "call police",
  "call ambulance",
];

const INCIDENT_KEYWORDS = {
  medical: ["can't breathe", "cant breathe", "unconscious", "not breathing", "heart", "bleeding", "injury"],
  accident: ["accident", "car crash", "collision", "hit by", "vehicle"],
  fire: ["fire", "smoke", "burning"],
  crime: ["robbery", "attack", "assault", "violence", "police", "threat"],
};

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function detectRepeatedPhrase(text, phrase = "help") {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const tokens = normalized.split(" ");
  const count = tokens.filter((token) => token === phrase).length;
  return count >= 2 || normalized.includes(`${phrase} ${phrase}`);
}

export function classifyIncident(text) {
  const normalized = normalizeText(text);
  for (const [type, keywords] of Object.entries(INCIDENT_KEYWORDS)) {
    if (keywords.some((word) => normalized.includes(word))) return type;
  }
  return "unknown";
}

export function evaluateEmergencyText(text) {
  const normalized = normalizeText(text);
  const phraseMatches = EMERGENCY_PHRASES.filter((phrase) => normalized.includes(phrase));
  const repeatedHelp = detectRepeatedPhrase(normalized, "help");
  const detected = repeatedHelp || phraseMatches.length > 0;
  const incidentType = classifyIncident(normalized);

  return {
    detected,
    incidentType,
    confidence: detected ? (repeatedHelp ? "high" : "medium") : "low",
    reasons: [
      ...(repeatedHelp ? ["repeated help phrase detected"] : []),
      ...phraseMatches.map((phrase) => `matched phrase: ${phrase}`),
    ],
  };
}
