// src/hooks/useMySpeech.js
// A small React hook wrapping the Web Speech API (SpeechRecognition).
// Exposes: { transcript, listening, start, stop, reset, setTranscript }
// If Web Speech API unavailable, it returns no-op functions and empty transcript.

import { useEffect, useRef, useState, useCallback } from "react";

export default function useMySpeech({ lang = "en-US", continuous = false, interimResults = false } = {}) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const w = window;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition || null;
    if (!SpeechRecognition) {
      recognitionRef.current = null;
      return;
    }
    const r = new SpeechRecognition();
    r.lang = lang;
    r.continuous = continuous;
    r.interimResults = interimResults;
    r.maxAlternatives = 1;

    r.onresult = (ev) => {
      try {
        // accumulate results
        let final = "";
        for (let i = 0; i < ev.results.length; i++) {
          const res = ev.results[i];
          final += res[0].transcript;
        }
        setTranscript((prev) => (continuous ? prev + " " + final : final));
      } catch (e) {
        console.warn("Speech onresult parse error", e);
      }
    };

    r.onend = () => {
      setListening(false);
    };

    r.onerror = (err) => {
      console.warn("Speech recognition error", err);
      setListening(false);
    };

    recognitionRef.current = r;

    return () => {
      try {
        r.onresult = null;
        r.onend = null;
        r.onerror = null;
        r.stop && r.stop();
      } catch {}
    };
  }, [lang, continuous, interimResults]);

  const start = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return false;
    try {
      r.start();
      setListening(true);
      return true;
    } catch (e) {
      console.warn("Speech start failed", e);
      setListening(false);
      return false;
    }
  }, []);

  const stop = useCallback(() => {
    const r = recognitionRef.current;
    if (!r) return false;
    try {
      r.stop();
      setListening(false);
      return true;
    } catch (e) {
      console.warn("Speech stop failed", e);
      setListening(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
  }, []);

  return { transcript, listening, start, stop, reset, setTranscript };
}