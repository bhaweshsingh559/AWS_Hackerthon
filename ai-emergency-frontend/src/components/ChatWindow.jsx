// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from "react";


const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3002").replace(/\/$/, "");

function genId(prefix = "") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return prefix + crypto.randomUUID();
  }
  return prefix + `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function readJsonSafe(res) {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(API_BASE + path, { ...opts, headers }).then(async (res) => {
    const body = await readJsonSafe(res);
    if (!res.ok) {
      const err = new Error(body?.error || res.statusText || `API ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body ?? {};
  });
}

function makeMapsLink(location) {
  if (!location) return "";
  const lat = Number(location.lat ?? location.latitude);
  const lon = Number(location.lon ?? location.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;
}

function makeMapsSearchLink(location, query) {
  const baseQuery = encodeURIComponent(query || "emergency");
  if (!location) return `https://www.google.com/maps/search/?api=1&query=${baseQuery}`;
  const lat = Number(location.lat ?? location.latitude);
  const lon = Number(location.lon ?? location.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return `https://www.google.com/maps/search/?api=1&query=${baseQuery}`;
  const loc = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  return `https://www.google.com/maps/search/?api=1&query=${baseQuery}%20near%20${encodeURIComponent(loc)}`;
}

const EMERGENCY_CANCEL_WINDOW_SECONDS = Number(
  import.meta.env.VITE_VOICE_CANCEL_WINDOW_SECONDS || 10
);

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
  return (text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function detectRepeatedPhrase(text, phrase = "help") {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const tokens = normalized.split(" ");
  let count = 0;
  for (const token of tokens) {
    if (token === phrase) count += 1;
  }
  return count >= 2 || normalized.includes(`${phrase} ${phrase}`);
}

function classifyIncident(text) {
  const normalized = normalizeText(text);
  for (const [type, keywords] of Object.entries(INCIDENT_KEYWORDS)) {
    if (keywords.some((word) => normalized.includes(word))) return type;
  }
  return "unknown";
}

function localEmergencyDetection(text) {
  const normalized = normalizeText(text);
  const matches = EMERGENCY_PHRASES.filter((phrase) => normalized.includes(phrase));
  const repeatedHelp = detectRepeatedPhrase(normalized, "help");
  const detected = repeatedHelp || matches.length > 0;
  const incidentType = classifyIncident(normalized);
  return {
    detected,
    incidentType,
    reasons: [
      ...(repeatedHelp ? ["repeated help phrase detected"] : []),
      ...matches.map((m) => `matched phrase: ${m}`),
    ],
    confidence: detected ? (repeatedHelp ? "high" : "medium") : "low",
  };
}

export default function ChatWindow() {
  const [messages, setMessages] = useState([
    { id: genId("s-"), sender: "bot", text: "🚑 Emergency Assistant ready. Type or press the mic. Type 'SOS' or press the SOS button to send an alert." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastParsed, setLastParsed] = useState(null);
  const [pendingEmergency, setPendingEmergency] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try {
      return localStorage.getItem("voiceFeedback") !== "off";
    } catch {
      return true;
    }
  });
  const [assistanceLinks, setAssistanceLinks] = useState(null);
  const areaRef = useRef(null);
  const recognitionRef = useRef(null);
  const pendingEmergencyRef = useRef(null);

  // THEME DETECTION (reads data-theme attr and watches changes)
  const [theme, setTheme] = useState(() => {
    try {
      return document.documentElement.getAttribute("data-theme") || "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-theme") {
          setTheme(root.getAttribute("data-theme") || "light");
        }
      }
    });
    mo.observe(root, { attributes: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!areaRef.current) return;
    try { areaRef.current.scrollTo({ top: 99999, behavior: "smooth" }); } catch { areaRef.current.scrollTop = areaRef.current.scrollHeight; }
  }, [messages]);

  useEffect(() => {
    pendingEmergencyRef.current = pendingEmergency;
  }, [pendingEmergency]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const w = window;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition || null;
    if (!SpeechRecognition) return;
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (ev) => {
      const t = ev.results?.[0]?.[0]?.transcript;
      if (t) {
        const normalized = normalizeText(t);
        if (pendingEmergencyRef.current && normalized === "cancel") {
          appendUserMessage(t);
          cancelEmergency();
          return;
        }
        appendUserMessage(t);
        handleEmergencyDetection(t, { source: "voice" }).finally(() => {
          sendAnalyze(t);
        });
      }
    };
    r.onerror = (e) => {
      console.warn("SpeechRecognition error", e);
      setListening(false);
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, []);

  useEffect(() => {
    if (!pendingEmergency) return undefined;
    if (pendingEmergency.remaining <= 0) {
      confirmEmergencyNow(pendingEmergency);
      return undefined;
    }
    const timer = setTimeout(() => {
      setPendingEmergency((prev) => {
        if (!prev) return prev;
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [pendingEmergency]);

  function appendUserMessage(text, providedId = null) {
    const id = providedId || genId("u-");
    setMessages((m) => [...m, { id, sender: "user", text }]);
  }
  function appendBotMessage(text, providedId = null) {
    const id = providedId || genId("b-");
    setMessages((m) => [...m, { id, sender: "bot", text }]);
  }
  function appendSystem(text, providedId = null) {
    const id = providedId || genId("s-");
    setMessages((m) => [...m, { id, sender: "system", text }]);
  }

  async function sendAnalyze(text, vitals = null) {
    if (!text || !text.trim()) return;
    setLoading(true);
    appendBotMessage("Processing...");

    let location = null;
    try { location = await getLocation(7000).catch(() => null); } catch { location = null; }

    const payload = { text };
    if (vitals) payload.vitals = vitals;
    if (location) payload.location = { lat: location.lat, lon: location.lon };

    try {
      const resp = await apiFetch("/api/emergency/analyze", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setMessages((m) => m.filter((x) => x.text !== "Processing..."));

      if (resp && resp.success) {
        const parsed = resp.result || {};
        setLastParsed(parsed);
        const short = parsed.alertMessage || (Array.isArray(parsed.instructions) && parsed.instructions.length ? parsed.instructions[0] : "Stay calm. Help is on the way.");
        appendBotMessage(short);
        if (parsed.triggerAlert) appendBotMessage("This situation requires alerting your emergency contacts.");
      } else {
        appendBotMessage("Unexpected response from server.");
        console.warn("Analyze unexpected:", resp);
      }
    } catch (err) {
      console.error("analyze error", err);
      setMessages((m) => m.filter((x) => x.text !== "Processing..."));
      appendBotMessage("Error contacting server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendClick() {
    if (!input || !input.trim()) return;
    const txt = input.trim();
    if (pendingEmergency && normalizeText(txt) === "cancel") {
      appendUserMessage(txt);
      setInput("");
      cancelEmergency();
      return;
    }
    appendUserMessage(txt);
    setInput("");
    if (/^\s*sos\s*$/i.test(txt)) {
      await triggerSOS("SOS: user requested immediate help");
      return;
    }
    await handleEmergencyDetection(txt, { source: "text" });
    await sendAnalyze(txt);
  }

  // location helper
  function getLocation(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout, maximumAge: 0 }
      );
    });
  }

  // contacts helper (ensures user has emergencyContacts)
  async function ensureContactsPresentPrompt() {
    const raw = localStorage.getItem("user");
    let localUser = raw ? JSON.parse(raw) : null;
    if (localUser?.emergencyContacts && Array.isArray(localUser.emergencyContacts) && localUser.emergencyContacts.length > 0) {
      return { ok: true, contacts: localUser.emergencyContacts };
    }
    // try server
    try {
      const me = await apiFetch("/api/auth/me", { method: "GET" });
      const u = me?.user || me;
      if (u?.emergencyContacts && Array.isArray(u.emergencyContacts) && u.emergencyContacts.length > 0) {
        localStorage.setItem("user", JSON.stringify(u));
        return { ok: true, contacts: u.emergencyContacts };
      }
    } catch (e) { /* ignore */ }

    // prompt user input
    const txt = window.prompt("No emergency contacts found. Enter phone numbers (comma-separated, include country code like +91):", "");
    if (!txt) return { ok: false, contacts: null };
    const arr = txt.split(",").map(s => s.trim()).filter(Boolean);
    if (arr.length === 0) return { ok: false, contacts: null };

    // try to save
    try {
      const resp = await apiFetch("/api/user/contacts", {
        method: "POST",
        body: JSON.stringify({ contacts: arr }),
      });
      if (resp && resp.success && resp.user) {
        localStorage.setItem("user", JSON.stringify(resp.user));
        return { ok: true, contacts: arr };
      } else {
        alert("Saved locally but server returned an error. Contacts will be used for this SOS attempt.");
        localStorage.setItem("user", JSON.stringify({ emergencyContacts: arr }));
        return { ok: true, contacts: arr };
      }
    } catch (err) {
      console.error("postUserContacts error", err);
      alert("Could not save contacts to server; will attempt to send alert using provided numbers this one time.");
      localStorage.setItem("user", JSON.stringify({ emergencyContacts: arr }));
      return { ok: true, contacts: arr };
    }
  }

  // SOS flow
  async function triggerSOS(message = null) {
    const ensure = await ensureContactsPresentPrompt();
    if (!ensure.ok) { appendBotMessage("SOS cancelled — no contacts provided."); return; }
    const contacts = ensure.contacts || [];

    appendUserMessage("SOS ⚠️");
    appendBotMessage("Attempting to acquire location...");

    setLoading(true);
    try {
      let location = null;
      try {
        location = await getLocation(10000);
        if (location) appendBotMessage("Location acquired — sending SOS with location.");
      } catch (geoErr) {
        console.warn("Geo failed:", geoErr);
        const cont = window.confirm("Could not get location (permission denied or timed out). Send SOS without location?");
        if (!cont) { appendBotMessage("SOS cancelled."); setLoading(false); return; }
        appendBotMessage("Sending SOS without precise location.");
      }

      const desc = message || (input && input.trim() ? input.trim() : "Help needed immediately");
      appendBotMessage(`Sending alert: "${desc}"`);

      const payload = { message: `SOS: ${desc}`, location, contacts };

      const resp = await apiFetch("/api/emergency/alert", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (resp && resp.success) {
        appendBotMessage("✅ SOS sent. Contacts will be notified.");
        speakText("Emergency alert sent. Sharing your location with your contacts.");
        if (resp.preview) appendBotMessage(`Preview: ${resp.preview}`);
        if (resp.results) console.debug("SOS results:", resp.results);
        const hospitalLink = makeMapsSearchLink(location, "nearest hospital");
        const policeLink = makeMapsSearchLink(location, "nearest police station");
        setAssistanceLinks({ hospital: hospitalLink, police: policeLink, location });
      } else {
        appendBotMessage("⚠️ Failed to send SOS. See console for details.");
        console.warn("postAlert response:", resp);
      }
    } catch (err) {
      console.error("SOS failed", err);
      appendBotMessage("⚠️ Error sending SOS. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // mic controls
  function handleMicStart() {
    const r = recognitionRef.current;
    if (!r) {
      alert("Speech recognition not available in this browser.");
      return;
    }
    setListening(true);
    try { r.start(); } catch (e) { console.warn("Failed to start recognition", e); setListening(false); }
  }
  function handleMicStop() {
    const r = recognitionRef.current;
    try { r?.stop(); } catch (e) { console.warn("stop error", e); }
    setListening(false);
  }

  async function handleEmergencyDetection(text, { source }) {
    if (!text || pendingEmergency) return false;
    const normalized = normalizeText(text);
    if (!normalized) return false;
    let detection = null;
    try {
      detection = await apiFetch("/api/emergency/detect", {
        method: "POST",
        body: JSON.stringify({ text: normalized, source }),
      });
      detection = detection?.result || detection;
    } catch (err) {
      console.warn("Emergency detect failed, using local fallback", err);
      detection = localEmergencyDetection(normalized);
    }

    if (!detection?.detected) return false;

    const incidentType = detection?.incidentType || "unknown";
    appendBotMessage(
      `🚨 Emergency detected (${incidentType}). Say "cancel" within ${EMERGENCY_CANCEL_WINDOW_SECONDS}s to stop.`
    );
    speakText(`Emergency detected. Say cancel within ${EMERGENCY_CANCEL_WINDOW_SECONDS} seconds to stop.`);
    setPendingEmergency({
      id: genId("em-"),
      message: normalized,
      incidentType,
      remaining: EMERGENCY_CANCEL_WINDOW_SECONDS,
      source,
    });
    return true;
  }

  async function confirmEmergencyNow(pending) {
    if (!pending) return;
    setPendingEmergency(null);
    const incidentLabel = pending.incidentType && pending.incidentType !== "unknown"
      ? `Incident type: ${pending.incidentType}.`
      : "Incident type: unknown.";
    await triggerSOS(`${pending.message} ${incidentLabel}`);
  }

  function cancelEmergency() {
    if (!pendingEmergency) return;
    setPendingEmergency(null);
    appendBotMessage("✅ Emergency cancelled.");
    speakText("Emergency cancelled.");
  }

  function speakText(text) {
    if (!voiceEnabled || !text || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("speech synthesis failed", err);
    }
  }

  function toggleVoiceFeedback() {
    setVoiceEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("voiceFeedback", next ? "on" : "off");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  // THEME-aware styles (simple inline approach)
  const isDark = theme === "dark";
  const containerBg = isDark ? "#0b1220" : "#ffffff";
  const panelBg = isDark ? "#081026" : "#f8fafc";
  const botBubbleBg = isDark ? "linear-gradient(90deg,#0f172a,#102030)" : "#f6f9fb";
  const userBubbleBg = isDark ? "linear-gradient(90deg,#0f3a2f,#0b6b53)" : "linear-gradient(90deg,#e6fff2,#d1f7e0)";
  const textColor = isDark ? "#e6eef6" : "#0f172a";
  const metaColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(15,23,42,0.65)";

  return (
    <div className="emergency-chat" style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", height: "78vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: textColor }}>Rakshak — Emergency Assistant</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn btn--ghost" onClick={toggleVoiceFeedback}>
            {voiceEnabled ? "Voice: On" : "Voice: Off"}
          </button>
          <button className="btn btn--ghost" onClick={() => window.location.reload()}>Refresh</button>
          <button className="btn btn--danger pulse-alert" onClick={() => triggerSOS()} disabled={loading}>SOS</button>
        </div>
      </div>

      <div ref={areaRef} style={{ flex: 1, overflowY: "auto", padding: 12, borderRadius: 10, background: containerBg, boxShadow: isDark ? "0 6px 18px rgba(0,0,0,0.6)" : "0 6px 18px rgba(2,6,23,0.06)" }}>
        <div style={{ padding: 12, borderRadius: 8, background: panelBg }}>
          {messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{
                background: m.sender === "user" ? userBubbleBg : botBubbleBg,
                padding: "10px 14px",
                borderRadius: 12,
                maxWidth: "78%",
                boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.6)" : "0 4px 10px rgba(0,0,0,0.03)",
                whiteSpace: "pre-wrap",
                color: textColor,
                border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(2,6,23,0.03)"
              }}>
                <div style={{ fontSize: 12, marginBottom: 6, color: metaColor }}>{m.sender === "user" ? "You" : (m.sender === "bot" ? "Rakshak AI" : "System")}</div>
                <div style={{ fontSize: 15 }}>{m.text}</div>
              </div>
            </div>
          ))}

          {lastParsed && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: isDark ? "#071019" : "#fffef6", border: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "#f0e9d8"}`, color: textColor }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>AI Assessment — {lastParsed.severity || "UNKNOWN"}</div>
              {Array.isArray(lastParsed.instructions) && lastParsed.instructions.length > 0 && (
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {lastParsed.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                </ol>
              )}
              {lastParsed.reasoning && <div style={{ marginTop: 8, fontSize: 13, opacity: 0.9 }}>Reason: {lastParsed.reasoning}</div>}
            </div>
          )}
        </div>
      </div>

      {pendingEmergency && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          background: isDark ? "#2a0b0b" : "#fff1f2",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#fecdd3"}`,
          color: textColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>Emergency detected</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Sending alert in {pendingEmergency.remaining}s unless cancelled.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" onClick={cancelEmergency}>Cancel</button>
            <button className="btn btn--danger" onClick={() => confirmEmergencyNow(pendingEmergency)}>Send Now</button>
          </div>
        </div>
      )}

      {assistanceLinks && (
        <div style={{
          marginTop: 12,
          padding: 12,
          borderRadius: 10,
          background: isDark ? "#0b1b14" : "#ecfdf3",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#bbf7d0"}`,
          color: textColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>Nearby emergency assistance</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Open directions to the nearest hospital or police station.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="btn btn--ghost" href={assistanceLinks.hospital} target="_blank" rel="noreferrer">
              Nearest Hospital
            </a>
            <a className="btn btn--ghost" href={assistanceLinks.police} target="_blank" rel="noreferrer">
              Nearest Police
            </a>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message or 'SOS' to send alert..."
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${isDark ? "#1f2937" : "#e6eef2"}`,
            fontSize: 14,
            background: isDark ? "#071224" : "#fff",
            color: textColor,
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendClick(); } }}
          disabled={loading}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button onClick={handleSendClick} className="btn" disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => listening ? handleMicStop() : handleMicStart()}
              className={`btn btn--ghost`}
              title="Start/stop speech"
            >
              {listening ? "Stop mic" : "Mic"}
            </button>
            <button
              className="btn btn--ghost"
              onClick={async () => {
                try {
                  const loc = await getLocation(7000);
                  if (loc) {
                    const link = makeMapsLink(loc);
                    await navigator.clipboard.writeText(link);
                    alert("Location link copied to clipboard. Paste to contacts or chat.");
                  } else {
                    alert("Could not get location.");
                  }
                } catch (e) {
                  alert("Unable to copy location.");
                }
              }}
            >
              Copy loc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
