import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardOverview, getNearbyHospitals, postAlert, postEmergencyResponse } from "../api/http";

export default function Chat() {
  const IconBell = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15 18H9a3 3 0 0 0 6 0ZM18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconMoon = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21 14.5A8.5 8.5 0 0 1 9.5 3a7.5 7.5 0 1 0 11.5 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconMapPin = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
  const IconUser = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M20 21a8 8 0 1 0-16 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
  const IconMic = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 15a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 11a7 7 0 0 1-14 0M12 19v3M8 22h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconPhone = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M4 6.5c0 7.5 6.1 13.6 13.6 13.6h1.4a2 2 0 0 0 2-2v-2.4a2 2 0 0 0-1.4-1.9l-3.2-1a2 2 0 0 0-2.1.6l-1.1 1.3a12 12 0 0 1-5.1-5.1l1.3-1.1a2 2 0 0 0 .6-2.1l-1-3.2A2 2 0 0 0 7.3 2H5a2 2 0 0 0-2 2v2.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconHome = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconChat = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const IconSettings = (props) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 0 1 7 3.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [dynamicHospitals, setDynamicHospitals] = useState([]);
  const [pendingCall, setPendingCall] = useState(null);
  const [pendingEmergency, setPendingEmergency] = useState(null);
  const [emergencyResponse, setEmergencyResponse] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [wakePhraseEnabled, setWakePhraseEnabled] = useState(true);
  const [wakePhraseActiveUntil, setWakePhraseActiveUntil] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [emergencyTranscript, setEmergencyTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const navigate = useNavigate();
  const activityRef = useRef(null);
  const centerRef = useRef(null);
  const contextRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");
  const recognitionActiveRef = useRef(false);

  const handleScrollTo = (ref) => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return Promise.resolve(null);
    }
    setLocationStatus("locating");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setCurrentLocation(coords);
          setLocationStatus("ready");
          resolve(coords);
        },
        (err) => {
          console.warn("dashboard geolocation failed", err);
          setLocationStatus("blocked");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  useEffect(() => {
    if (!currentLocation) return undefined;
    const controller = new AbortController();
    const fetchAddress = async () => {
      try {
        const params = new URLSearchParams({
          format: "jsonv2",
          lat: String(currentLocation.lat),
          lon: String(currentLocation.lon),
          zoom: "18",
          addressdetails: "1",
        });
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          signal: controller.signal,
          headers: { "Accept-Language": "en" },
        });
        if (!resp.ok) throw new Error(`reverse geocode failed: ${resp.status}`);
        const data = await resp.json();
        const label = data.display_name || "";
        setLocationAddress(label);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("reverse geocoding failed", err);
        }
      }
    };
    fetchAddress();
    return () => controller.abort();
  }, [currentLocation]);

  const fetchNearbyHospitals = async (coords) => {
    if (!coords) return [];
    const radius = 30000;
    try {
      const resp = await getNearbyHospitals(coords.lat, coords.lon, radius);
      if (resp?.hospitals?.length) {
        return resp.hospitals.map((hospital) => ({
          ...hospital,
          distanceKm: null,
          rating: hospital.rating ?? null,
        }));
      }
    } catch (err) {
      console.warn("google hospitals lookup failed, falling back", err);
    }

    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius},${coords.lat},${coords.lon});
        way["amenity"="hospital"](around:${radius},${coords.lat},${coords.lon});
        relation["amenity"="hospital"](around:${radius},${coords.lat},${coords.lon});
      );
      out center tags;
    `;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      const data = await res.json();
      return (data.elements || []).map((item) => {
        const lat = item.lat ?? item.center?.lat;
        const lon = item.lon ?? item.center?.lon;
        return {
          name: item.tags?.name || "Nearby Hospital",
          distanceKm: null,
          rating: item.tags?.rating || item.tags?.stars || null,
          phone: item.tags?.phone || item.tags?.["contact:phone"] || "N/A",
          address: item.tags?.["addr:full"] || item.tags?.["addr:street"] || "",
          lat,
          lon,
          status: "available",
        };
      });
    } catch (err) {
      console.warn("hospital lookup failed", err);
      return [];
    }
  };

  const calculateDistanceKm = (coords, hospital) => {
    if (!coords || hospital.lat == null || hospital.lon == null) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(hospital.lat - coords.lat);
    const dLon = toRad(hospital.lon - coords.lon);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(coords.lat)) * Math.cos(toRad(hospital.lat)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const buildLocalEmergencyFallback = (text) => {
    const lowered = text.toLowerCase();
    if (["heart attack", "chest pain", "cardiac", "no pulse", "not breathing", "cant breathe", "can't breathe"].some((term) => lowered.includes(term))) {
      return {
        response: "Possible critical medical emergency detected. Call emergency services now and monitor breathing.",
        instructions: [
          "Call emergency services immediately.",
          "Keep the person still and monitor breathing.",
          "Prepare to perform CPR if breathing stops and you are trained.",
        ],
      };
    }
    return {
      response: "Possible emergency detected. If this is urgent, call local emergency services immediately.",
      instructions: [
        "Call emergency services if needed.",
        "Stay calm and describe the situation clearly.",
      ],
    };
  };

  const getStoredContacts = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const rawContacts = stored?.emergencyContacts || stored?.EmergencyContacts || [];
      if (Array.isArray(rawContacts)) return rawContacts;
      if (typeof rawContacts === "string") {
        try {
          const parsed = JSON.parse(rawContacts);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return rawContacts.split(",").map((item) => item.trim()).filter(Boolean);
        }
      }
      return [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await getDashboardOverview();
        if (mounted) setOverview(resp.overview || null);
      } catch (err) {
        console.warn("dashboard overview failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return undefined;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onstart = () => {
      recognitionActiveRef.current = true;
      setIsListening(true);
    };
    recognition.onend = () => {
      recognitionActiveRef.current = false;
      setIsListening(false);
      if (wakePhraseEnabled) {
        try {
          if (!recognitionActiveRef.current) recognition.start();
        } catch (err) {
          console.warn("auto-restart recognition failed", err);
        }
      }
    };
    recognition.onerror = (event) => {
      console.warn("speech recognition error", event);
      recognitionActiveRef.current = false;
      setIsListening(false);
      if (wakePhraseEnabled) {
        try {
          if (!recognitionActiveRef.current) recognition.start();
        } catch (err) {
          console.warn("auto-restart after error failed", err);
        }
      }
    };
    recognition.onresult = (event) => {
      let interim = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";
        if (result.isFinal) {
          finalTranscript += ` ${text}`;
        } else {
          interim += ` ${text}`;
        }
      }
      const combined = `${finalTranscript} ${interim}`.toLowerCase();
      const wakePhrases = ["hey rakshak", "emergency assistant"];
      const wakeDetected = wakePhrases.some((phrase) => combined.includes(phrase));
      if (wakePhraseEnabled && wakeDetected) {
        const activeUntil = Date.now() + 20000;
        setWakePhraseActiveUntil(activeUntil);
      }
      const emergencyKeywords = [
        "help me",
        "i am in trouble",
        "emergency",
        "heart attack",
        "call ambulance",
        "need help",
        "help",
        "bachao",
        "bachaoo",
        "bachaoo please",
        "koi mera picha kar raha hai",
        "koi mera peecha kar raha hai",
        "someone chasing me",
        "save me",
        "fire",
        "attack",
        "danger",
        "accident",
        "bleeding",
        "panic",
        "faint",
      ];
      if (!pendingEmergency && emergencyKeywords.some((keyword) => combined.includes(keyword))) {
        const phrase = finalTranscript.trim() || interim.trim() || combined.trim();
        transcriptRef.current = phrase;
        setEmergencyTranscript(phrase);
        setPendingEmergency({
          remaining: 10,
          phrase,
        });
        setEmergencyResponse(null);
        setEmergencyLoading(true);
        postEmergencyResponse({
          text: phrase,
          context: {
            location: currentLocation || null,
          },
          contacts: getStoredContacts(),
        })
          .then((resp) => setEmergencyResponse(resp))
          .catch((err) => {
            console.warn("emergency response failed", err);
            setEmergencyResponse(buildLocalEmergencyFallback(phrase));
          })
          .finally(() => setEmergencyLoading(false));
        recognition.stop();
      } else {
        setEmergencyTranscript("");
      }
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
  }, [pendingEmergency, wakePhraseEnabled, wakePhraseActiveUntil]);

  useEffect(() => {
    if (!speechSupported || !recognitionRef.current) return;
    const requestMic = async () => {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      } catch (err) {
        console.warn("microphone permission denied", err);
      }
      try {
        if (!recognitionActiveRef.current) recognitionRef.current.start();
      } catch (err) {
        console.warn("auto-start recognition failed", err);
      }
    };
    requestMic();
  }, [speechSupported]);

  useEffect(() => {
    if (!speechSupported || !recognitionRef.current) return;
    if (!wakePhraseEnabled) return;
    const interval = setInterval(() => {
      if (!isListening) {
        try {
          if (!recognitionActiveRef.current) recognitionRef.current.start();
        } catch (err) {
          console.warn("periodic restart failed", err);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [speechSupported, wakePhraseEnabled, isListening]);

  useEffect(() => {
    if (!pendingCall) return undefined;
    if (pendingCall.remaining <= 0) {
      handleConfirmCall(pendingCall);
      return undefined;
    }
    const timer = setTimeout(() => {
      setPendingCall((prev) => {
        if (!prev) return prev;
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [pendingCall]);

  useEffect(() => {
    if (!pendingEmergency) return undefined;
    if (pendingEmergency.remaining <= 0) {
      handleEmergencyAlert(pendingEmergency);
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

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!pendingCall) return;
      if (event.key === "1") {
        handleSendWhatsApp(pendingCall);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [pendingCall]);

  useEffect(() => {
    let mounted = true;
    const loadHospitals = async () => {
      const coords = await requestLocation();
      if (!mounted || !coords) return;
      const nearby = await fetchNearbyHospitals(coords);
      if (!mounted) return;
      const withDistance = nearby
        .map((hospital) => ({
          ...hospital,
          distanceKm: hospital.distanceKm ?? calculateDistanceKm(coords, hospital),
        }))
        .filter((hospital) => hospital.distanceKm == null || hospital.distanceKm <= 30);
      setDynamicHospitals(withDistance);
    };
    loadHospitals();
    const interval = setInterval(loadHospitals, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const safetyFeatures = [
    "Fire Safety",
    "Tsunami Safety",
    "Health Emergency",
    "Accidental Safety",
    "Girls Safety",
    "Old Age Safety",
    "Bomb Threat Safety",
    "Area Crime Alerts",
    "Travel Safety Alerts",
    "Flood Warning",
    "Earthquake Safety",
    "Cyclone Alerts",
  ];

  const defaultHospitals = [
    { name: "City Hospital", distanceKm: 12.4, rating: 4.8, status: "available" },
    { name: "Apollo Clinic", distanceKm: 18.2, rating: 4.7, status: "available" },
    { name: "Rakshak Care", distanceKm: 24.5, rating: 4.6, status: "available" },
    { name: "Medilife Specialty", distanceKm: 27.1, rating: 4.5, status: "available" },
  ];

  const hospitals = useMemo(() => {
    const source = dynamicHospitals.length > 0
      ? dynamicHospitals
      : (overview?.hospitals || defaultHospitals);
    const normalized = source.map((hospital) => ({
      ...hospital,
      rating: hospital.rating ?? null,
      distanceKm: hospital.distanceKm ?? 22.0,
      phone: hospital.phone || "N/A",
      address: hospital.address || "",
      status: hospital.status || "available",
    }));
    return normalized
      .filter((hospital) => hospital.distanceKm <= 30)
      .sort((a, b) => {
        const aHasPhone = a.phone && a.phone !== "N/A";
        const bHasPhone = b.phone && b.phone !== "N/A";
        if (aHasPhone !== bHasPhone) return aHasPhone ? -1 : 1;
        const aRating = Number(a.rating) || 0;
        const bRating = Number(b.rating) || 0;
        return bRating - aRating || a.distanceKm - b.distanceKm;
      });
  }, [dynamicHospitals, overview]);

  const hero = overview?.hero || {
    status: "Listening...",
    detectedBy: "Voice",
    location: "Bhandarkar, Pune",
    category: "Medical Emergency",
  };

  const user = overview?.user || { name: "Responder", premium: true };
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const emergencyContact = storedUser?.emergencyContacts?.[0] || "N/A";
  const displayLocation = currentLocation
    ? (locationAddress || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`)
    : hero.location;
  const locationQuery = encodeURIComponent(`${displayLocation} hospitals`);
  const mapUrl = currentLocation
    ? `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lon}&z=14&output=embed`
    : null;

  const handleHospitalView = (hospital) => {
    const query = encodeURIComponent(`${hospital.name} ${displayLocation}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  const speakAnnouncement = (hospital, locationText) => {
    if (!("speechSynthesis" in window)) return;
    const name = user?.name || "the user";
    const phone = emergencyContact === "N/A" ? "no emergency contact available" : emergencyContact;
    const locationLine = locationText ? `The user is located at ${locationText}.` : "";
    const text = `Hey, I am ${name}. Rakshak AI voice assistance. This user is in trouble, please help. Emergency contact ${phone}. ${locationLine}`;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "en-US";
      window.speechSynthesis.speak(utter);
    } catch (err) {
      console.warn("speech synthesis failed", err);
    }
  };

  const handleCallHospital = (hospital) => {
    const fallbackPhone = "6388430012";
    const phone = hospital?.phone && hospital.phone !== "N/A" ? hospital.phone : fallbackPhone;
    setPendingCall({
      hospital: {
        ...hospital,
        phone,
      },
      remaining: 10,
    });
    speakAnnouncement(hospital, displayLocation);
  };

  const handleConfirmCall = (pending) => {
    if (!pending?.hospital?.phone || pending.hospital.phone === "N/A") {
      setPendingCall(null);
      return;
    }
    const tel = pending.hospital.phone.replace(/[^+\d]/g, "");
    window.open(`tel:${tel}`, "_self");
    setPendingCall(null);
  };

  const handleCancelCall = () => {
    setPendingCall(null);
  };

  const handleSendWhatsApp = (pending) => {
    if (!pending) return;
    const locationLink = currentLocation
      ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lon}`
      : "Location unavailable";
    const name = user?.name || "User";
    const message = `Emergency assistance needed for ${name}. Location: ${locationLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmergencyAlert = async (pending) => {
    if (!pending) return;
    const locationLink = currentLocation
      ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lon}`
      : "Location unavailable";
    const name = user?.name || "User";
    const message = `Emergency detected for ${name}. Heard: "${pending.phrase}". Location: ${locationLink}`;
    const contacts = getStoredContacts();
    if (contacts.length > 0) {
      try {
        await postAlert({
          message,
          location: currentLocation || null,
          contacts,
        });
      } catch (err) {
        console.warn("failed to send SMS alert", err);
        window.alert(message);
      }
    } else {
      window.alert(message);
    }
    setPendingEmergency(null);
    setEmergencyResponse(null);
    setEmergencyLoading(false);
    setEmergencyTranscript("");
  };

  const handleCancelEmergency = () => {
    setPendingEmergency(null);
    setEmergencyResponse(null);
    setEmergencyLoading(false);
    setEmergencyTranscript("");
    if (speechSupported && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("resume recognition failed", err);
      }
    }
  };

  const handleMicToggle = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      setInterimTranscript("");
      transcriptRef.current = "";
      if (!recognitionActiveRef.current) recognitionRef.current.start();
    }
  };

  const handleWakePhraseToggle = () => {
    if (!speechSupported || !recognitionRef.current) return;
    setWakePhraseEnabled((prev) => {
      const next = !prev;
      if (next) {
        setWakePhraseActiveUntil(null);
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.warn("wake phrase start failed", err);
        }
      } else {
        setWakePhraseActiveUntil(null);
      }
      return next;
    });
  };

  const isEmergencyMode = Boolean(pendingEmergency);

  return (
    <div className={`dashboard-shell ${isEmergencyMode ? "dashboard-shell--emergency" : ""}`}>
      <div className="dashboard-topbar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-logo">
            <span className="dashboard-logo-mark" />
          </div>
          <div>
            <div className="dashboard-logo">Rakshak</div>
            <div className="dashboard-subtitle">AI Emergency Assistant</div>
          </div>
        </div>
        <div className="dashboard-actions">
          <button
            className="dashboard-icon"
            aria-label="Notifications"
            onClick={() => handleScrollTo(contextRef)}
          >
            <IconBell className="icon" />
          </button>
          <button className="dashboard-icon" aria-label="Theme">
            <IconMoon className="icon" />
          </button>
          <button className="dashboard-icon" aria-label="Locate" onClick={requestLocation}>
            <IconMapPin className="icon" />
          </button>
          <button className="dashboard-avatar" onClick={() => navigate("/profile")} aria-label="Profile">
            <IconUser className="icon" />
          </button>
          {user.premium && <span className="dashboard-pill">Premium</span>}
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-panel dashboard-left" ref={activityRef}>
          <div className="dashboard-panel-title">Safety Programs</div>
          <div className="dashboard-safety-list">
            {safetyFeatures.map((feature) => (
              <button key={feature} type="button" className="dashboard-safety-item">
                {feature}
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-center" ref={centerRef}>
          <div
            className={[
              "orb-shell",
              isListening ? "is-listening" : "",
              isEmergencyMode ? "is-emergency" : "",
            ].filter(Boolean).join(" ")}
          >
            <div className="orb-outer" />
            <div className={`orb-countdown-ring ${isEmergencyMode ? "is-active" : ""}`} />
            <div className="orb-core">
              <div className="orb-wave" />
              <div className="orb-wave orb-wave--alt" />
              <div className="orb-particles" />
              <div className="orb-wave-line" />
              <div className={`orb-audio-wave ${isListening ? "is-active" : ""}`}>
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className="orb-status">{isListening ? "Listening..." : hero.status}</div>
          <button className={`dashboard-mic ${isListening ? "dashboard-mic--active" : ""}`} onClick={handleMicToggle}>
            <IconMic className="icon" />
          </button>
          <button
            className={`dashboard-link ${wakePhraseEnabled ? "dashboard-link--active" : ""}`}
            type="button"
            onClick={handleWakePhraseToggle}
          >
            {wakePhraseEnabled ? "Wake phrase on" : "Wake phrase off"}
          </button>
          {isEmergencyMode && (
            <button className="dashboard-emergency-cancel" onClick={handleCancelEmergency}>
              CANCEL
            </button>
          )}
          <div className="dashboard-voice-panel">
            <div className="dashboard-voice-status">
              <span className={`dashboard-voice-dot ${isListening ? "is-active" : ""}`} />
              {speechSupported ? (
                isListening
                  ? (wakePhraseEnabled ? "Wake phrase on • Listening for emergency keywords…" : "Listening for emergency keywords…")
                  : "Allow mic access to enable always-on listening."
              ) : "Speech recognition not supported."}
            </div>
            <div className={`dashboard-voice-wave ${isListening ? "is-active" : ""}`}>
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            {emergencyTranscript && (
              <div className="dashboard-voice-transcript">
                <span className="dashboard-voice-final">{emergencyTranscript}</span>
              </div>
            )}
            {emergencyLoading && (
              <div className="dashboard-voice-guidance">
                <div className="dashboard-voice-guidance-title">Rakshak Guidance</div>
                <div className="dashboard-voice-guidance-text">Fetching guidance…</div>
              </div>
            )}
            {emergencyResponse?.response && (
              <div className="dashboard-voice-guidance">
                <div className="dashboard-voice-guidance-title">Rakshak Guidance</div>
                <div className="dashboard-voice-guidance-text">{emergencyResponse.response}</div>
                {Array.isArray(emergencyResponse.instructions) && emergencyResponse.instructions.length > 0 && (
                  <ul className="dashboard-voice-guidance-list">
                    {emergencyResponse.instructions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          {loading && <div className="dashboard-hint">Syncing emergency context…</div>}
        </div>

        <div className="dashboard-panel dashboard-right" ref={contextRef}>
          <div className="dashboard-panel-title">Context</div>
          <div className="dashboard-context-card">
            <div className="dashboard-context-row">
              <span>Detected by</span>
              <strong>{hero.detectedBy}</strong>
            </div>
            <div className="dashboard-context-row">
              <span>Location</span>
              <strong>{displayLocation}</strong>
            </div>
            <div className="dashboard-context-row">
              <span>Category</span>
              <strong>{hero.category}</strong>
            </div>
          </div>

          <div className="dashboard-panel-title dashboard-title-inline">
            Nearest Hospitals
            <button
              className="dashboard-link"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${locationQuery}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              View all
            </button>
          </div>
          <div className="dashboard-hospital-list dashboard-hospital-scroll">
            {hospitals.map((hospital) => {
              const ratingValue = Number(hospital.rating);
              const ratingLabel = Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue.toFixed(1) : "Not rated";
              return (
                <div key={`${hospital.name}-${hospital.lat ?? "x"}-${hospital.lon ?? "y"}-${hospital.address ?? ""}`} className="dashboard-hospital-card">
                  <div>
                  <button
                    className="dashboard-hospital-name dashboard-hospital-link"
                    type="button"
                    onClick={() => handleHospitalView(hospital)}
                  >
                    {hospital.name}
                  </button>
                    <div className="dashboard-hospital-meta">
                      {hospital.distanceKm} km • ⭐ {ratingLabel} • {hospital.status}
                    </div>
                    <div className="dashboard-hospital-meta">
                      {hospital.phone} {hospital.address ? `• ${hospital.address}` : ""}
                    </div>
                  </div>
                  <button className="dashboard-call" onClick={() => handleCallHospital(hospital)}>
                    <IconPhone className="icon" />
                  </button>
                </div>
              );
            })}
          </div>

          {pendingCall && (
            <div className="dashboard-callout-overlay">
              <div className="dashboard-callout-emergency">
                <div className="dashboard-callout-title">Emergency call in {pendingCall.remaining}s</div>
                <div className="dashboard-callout-meta">
                  Calling {pendingCall.hospital.name} • Press 1 to send WhatsApp location.
                </div>
                <div className="dashboard-callout-actions">
                  <button className="dashboard-link" onClick={() => handleSendWhatsApp(pendingCall)}>Send WhatsApp (1)</button>
                  <button className="dashboard-link" onClick={handleCancelCall}>Cancel call</button>
                </div>
              </div>
            </div>
          )}

          {pendingEmergency && (
            <div className="dashboard-callout-overlay">
              <div className="dashboard-callout-emergency">
                <div className="dashboard-callout-title">Emergency alert in {pendingEmergency.remaining}s</div>
                <div className="dashboard-callout-meta">
                  Sending alert to emergency contact unless canceled.
                </div>
                <div className="dashboard-callout-actions">
                  <button className="dashboard-link" onClick={handleCancelEmergency}>Cancel alert</button>
                </div>
              </div>
            </div>
          )}


          <div className="dashboard-map-card">
            {mapUrl ? (
              <iframe
                title="Dashboard location map"
                src={mapUrl}
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 14 }}
                loading="lazy"
              />
            ) : (
              <button className="dashboard-map-placeholder" type="button" onClick={requestLocation}>
                <div className="dashboard-map-pin" />
                <div className="dashboard-map-pin dashboard-map-pin--alt" />
                <div className="dashboard-map-hint">
                  {locationStatus === "locating" && "Detecting location…"}
                  {locationStatus === "blocked" && "Location blocked. Tap the pin icon to allow."}
                  {locationStatus === "unsupported" && "Location not supported."}
                  {locationStatus === "idle" && "Tap the pin icon to show your location."}
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-nav">
        <button className="nav-icon" onClick={() => navigate("/")}>
          <IconHome className="icon" />
        </button>
        <button className="nav-icon active" onClick={() => navigate("/chat")}>
          <IconChat className="icon" />
        </button>
        <button className="nav-icon nav-sos" onClick={() => handleScrollTo(centerRef)}>SOS</button>
        <button className="nav-icon" onClick={() => navigate("/profile")}>
          <IconUser className="icon" />
        </button>
        <button className="nav-icon" onClick={() => navigate("/profile")}>
          <IconSettings className="icon" />
        </button>
      </div>

      <div className="dashboard-shortcuts">
        <div className="dashboard-shortcut-card">
          <div>
            <div className="shortcut-title">Home</div>
            <div className="shortcut-subtitle">Overview & quick actions</div>
          </div>
          <button className="dashboard-call" onClick={() => navigate("/")}>Open</button>
        </div>
        <div className="dashboard-shortcut-card">
          <div>
            <div className="shortcut-title">Profile</div>
            <div className="shortcut-subtitle">Update emergency contacts</div>
          </div>
          <button className="dashboard-call" onClick={() => navigate("/profile")}>Manage</button>
        </div>
      </div>
    </div>
  );
}
