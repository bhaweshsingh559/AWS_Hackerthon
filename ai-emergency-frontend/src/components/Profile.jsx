// src/components/Profile.jsx
import React, { useEffect, useState } from "react";

// pick API base from Vite env (may be blank => same-origin / proxied)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

function toApi(path) {
  // if API_BASE is empty, use relative path so dev proxy works
  return API_BASE ? `${API_BASE.replace(/\/$/, "")}${path}` : path;
}

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");

  useEffect(() => {
    async function fetchMe() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(toApi("/api/auth/me"), {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(json?.error || `API ${resp.status}`);

        const u = json?.user || json || {};
        setUser(u);
        setName(u.name || u.Name || "");
        setPhone(u.phone || u.Phone || "");

        const eContacts = Array.isArray(u.emergencyContacts)
          ? u.emergencyContacts
          : u.EmergencyContacts
          ? typeof u.EmergencyContacts === "string"
            ? JSON.parse(u.EmergencyContacts)
            : u.EmergencyContacts
          : [];

        setContact1(eContacts[0] || "");
        setContact2(eContacts[1] || "");
        setMedicalInfo(u.medicalInfo || u.MedicalInfo || "");
      } catch (err) {
        console.error("fetchMe error", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  function normalizePhone(s) {
    return s?.trim() || "";
  }

  async function apiPost(path, body = {}) {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(toApi(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error || `API ${res.status}`);
    return json;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const contacts = [normalizePhone(contact1), normalizePhone(contact2)].filter(Boolean);
    if (contacts.length === 0) {
      setError("Please provide at least one emergency contact.");
      setSaving(false);
      return;
    }

    try {
      await apiPost("/api/user/contacts", { contacts });
      await apiPost("/api/user/profile", { name, phone, medicalInfo });

      const newUser = { ...(user || {}), name, phone, emergencyContacts: contacts, medicalInfo };
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);

      alert("Profile updated successfully.");
    } catch (err) {
      console.error("Save profile error", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-shell">
        <div className="profile-card"><h3>Loading profile…</h3></div>
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Profile & Emergency Contacts</h2>
          <span className="profile-badge">Emergency Ready</span>
        </div>

        <p className="profile-subtitle">
          Provide at least one emergency contact (these numbers will be notified when SOS is triggered).
        </p>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-field">
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>

          <div className="profile-field">
            <label>Primary phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91xxxxxxxxxx" />
          </div>

          <div className="profile-field">
            <label>Emergency contact 1</label>
            <input value={contact1} onChange={(e) => setContact1(e.target.value)} placeholder="+91xxxxxxxxxx" />
          </div>

          <div className="profile-field">
            <label>Emergency contact 2 (optional)</label>
            <input value={contact2} onChange={(e) => setContact2(e.target.value)} placeholder="+91yyyyyyyyyy" />
          </div>

          <div className="profile-field full">
            <label>Medical / allergy info (optional)</label>
            <textarea
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              rows={3}
              placeholder="Diabetes, Allergies, Blood type..."
            />
          </div>

          {error && <div className="profile-error">{error}</div>}

          <div className="profile-actions">
            <button className="profile-btn primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>

            <button
              type="button"
              className="profile-btn ghost"
              onClick={() => {
                setName(user?.name || user?.Name || "");
                setPhone(user?.phone || user?.Phone || "");
                const eContacts = user?.emergencyContacts || user?.EmergencyContacts || [];
                setContact1(eContacts[0] || "");
                setContact2(eContacts[1] || "");
                setMedicalInfo(user?.medicalInfo || "");
                setError(null);
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
