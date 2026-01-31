# Rakshak — Emergency AI Agent

**Web + Mobile + Voice**

Rakshak is a multi-platform emergency assistant designed to detect distress, guide users safely, and escalate emergencies by notifying trusted contacts and helping users reach nearby emergency services quickly.

---

## 1. Objectives

### Primary Goals

- Provide a unified emergency experience across Web and Mobile.
- Enable voice-first emergency detection (hands-free).
- Deliver location-aware emergency assistance.
- Ensure reliable, auditable escalation without replacing official emergency services.

### Non-Goals (Explicit)

- Rakshak does not replace emergency dispatch systems (112/108/911).
- Rakshak does not automatically dispatch ambulances or police without verified integrations.
- Rakshak does not provide diagnosis or advanced medical treatment advice.

---

## 2. Core Capabilities (Status)

### 2.1 Emergency Detection (Text + Voice) — **In Progress**

**Input Sources**
- Typed text (chat / SOS UI)
- Voice transcription (ASR)
- Local keyword spotting (offline fallback)

**Detection Logic — _Completed (Web)_**
- Phrase repetition (e.g., "help help")
- High-risk phrases:
  - “I can’t breathe”
  - “There’s an accident”
  - “Someone is unconscious”
  - “Call police / ambulance”

**Incident Classification — _Completed (Server)_**
- Performed server-side using AWS Bedrock / Amazon Lex with keyword fallback
- Categories:
  - medical
  - accident
  - fire
  - crime
  - unknown
- Endpoint: `POST /api/emergency/classify`

**False-Positive Protection — _Completed (Web)_**
- Audible confirmation via TTS
- Cancel window (default: 10 seconds)
- Explicit voice or tap-based cancellation

### 2.2 Dashboard Experience (Web) — **Completed**

**Overview & Analytics — _Completed (Web)_**
- Dashboard UI with quick access shortcuts
- Activity cards with downloadable export
- Context panel showing detection metadata

**Dashboard APIs — _Completed (Web)_**
- Overview data endpoint (`GET /api/dashboard/overview`)
- Activity export endpoint (`GET /api/dashboard/activity`)

---

## 3. Voice Assistant (Hands-Free Safety) — **In Progress**

**Wake & Listening — _In Progress_**
- Wake phrase (configurable):
  - "Hey Rakshak"
  - "Emergency Assistant"

**Speech Processing — _Completed (Web)_**
- Online ASR
- Web Speech API (Web)
- Native speech SDKs (Mobile)

**Offline fallback — _In Progress_**
- Local keyword spotter for "help help"

**Voice Feedback (TTS) — _Completed (Web)_**
- Emergency confirmation (browser TTS)
- Escalation status (browser TTS)
- Cancellation acknowledgment (browser TTS)

---

## 4. Smart Escalation Flow (Status)

Rakshak uses a controlled escalation pipeline to prevent false alerts while acting fast when needed.

### Escalation Steps

**Step 1 — Emergency Contacts (Primary) — _Completed_**

Notify configured emergency contacts via:
- SMS
- WhatsApp (Twilio)

Message includes:
- Emergency detected
- Google Maps location link
- Incident type (if classified)

**Step 2 — Local Emergency Assistance (Assistive) — _Completed (Web)_**

Identify nearest:
- Hospitals
- Police stations

Show **Directions** buttons (map search links) in the web UI. No automatic calling without user action.

**Step 3 — Continuous Tracking (Optional) — _In Progress_**

- Share live location for a limited time window
- User-controlled stop option

---

## 5. Location Intelligence — **In Progress**

**Location Sources — _Completed (Web)_**
- GPS (primary)
- Network location fallback
- Last known location (offline)

**Capabilities — _In Progress_**
- Reverse geocoding
- Distance-based ranking
- Google Maps deep links

**Data Stored (Minimal) — _In Progress_**
- Latitude / Longitude
- Timestamp
- Incident category

---

## 6. Hospital & Police Discovery — **In Progress**

**Data Sources**
- Google Places API (primary)
- OpenStreetMap / Overpass (fallback)

**Strategy**
- Search by current location
- Rank by:
  - Distance
  - Emergency availability
  - Reputation (optional curated list)

**Important Note**

Rakshak does not directly dispatch hospitals or police unless official APIs/partnerships exist. It assists users in contacting them faster.

---

## 7. Multi-Platform Support — **In Progress**

**Web Application — _In Progress_**
- Voice input (Web Speech API)
- SOS UI
- Location-based emergency suggestions
- AI chat assistance

**Mobile Application (Phase 3) — _In Progress_**
- React Native / Flutter
- Background location access
- Offline voice trigger
- Push notifications
- Lock-screen emergency UI

---

## 8. System Architecture — **In Progress**

```
Frontend (Web / Mobile)
 ├── Voice Detector
 ├── SOS & Chat UI
 ├── Location Services
 └── Permission Manager

Backend (Node.js)
 ├── Emergency Router Service
 ├── Incident Classifier (Bedrock / Lex)
 ├── Contact Notification Service (Twilio)
 ├── Location Resolver
 └── Audit Logger

External Services
 ├── AWS SNS
 ├── DynamoDB
 ├── Twilio (SMS / WhatsApp)
 └── Google Maps / Places API
```

---

## 9. Emergency State Machine — **In Progress**

```
IDLE
 ↓
SUSPECTED_EMERGENCY
 ↓ (confirm or timeout)
CONFIRMED
 ↓
ESCALATING
 ↓
CONTACTS_NOTIFIED
 ↓
ACTIVE_MONITORING
 ↓
RESOLVED / CANCELLED
```

---

## 10. Configuration & Environment Variables — **In Progress**

```
VOICE_WAKE_PHRASE=Hey Rakshak
VOICE_CANCEL_WINDOW_SECONDS=10

GOOGLE_MAPS_API_KEY=****
TWILIO_ACCOUNT_SID=****
TWILIO_AUTH_TOKEN=****

ENABLE_BACKGROUND_LISTENING=false
ENABLE_LIVE_LOCATION=true
```

---

## 11. UX Copy Guidelines — **In Progress**

**Detection**
- “I detected an emergency. Say cancel within 10 seconds to stop.”

**Escalation**
- “Emergency alert sent. Sharing your location with your contacts.”

**Assistance**
- “The nearest emergency hospital is 2.1 km away. Would you like to call?”

---

## 12. Privacy & Safety — **In Progress**

- Explicit opt-in for:
  - Microphone
  - Location
  - Background listening
- Minimal data retention
- Encrypted storage
- User-visible audit logs
- One-tap “Stop Emergency” control

---

## 13. Implementation Phases (Status)

**Phase 1 — Web Voice MVP — _In Progress_**
- Voice input
- Keyword detection
- SOS + contact alerts

**Phase 2 — AI Classification — _In Progress_**
- Incident classification
- Smarter routing

**Phase 3 — Mobile App — _In Progress_**
- Background detection
- Offline safety
- Push notifications

**Phase 4 — Verified Integrations — _In Progress_**
- Ambulance providers
- Hospital partnerships
- Government emergency systems (if available)

---

## 14. Success Criteria

- Emergency triggered in < 3 seconds
- False-positive rate minimized
- User can cancel within 10 seconds
- Contacts receive alert within 5 seconds
- Location accuracy within acceptable radius

---

## Final Note

Rakshak is designed to assist, accelerate, and protect — not replace emergency services. Safety, consent, and reliability are prioritized over automation.
