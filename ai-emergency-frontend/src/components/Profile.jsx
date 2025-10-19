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
      <div style={styles.page}>
        <div style={styles.card}><h3>Loading profile…</h3></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={{ ...styles.card, maxWidth: 820 }}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>Profile & Emergency Contacts</h2>
          <div style={styles.smallTag}>Manage your emergency info</div>
        </div>

        <p style={styles.subtitle}>
          Provide at least one emergency contact (these numbers will be notified when SOS is triggered).
        </p>

        <form onSubmit={handleSave} style={{ width: "100%", display: "grid", gap: 12 }}>
          <div style={styles.row}>
            <label style={styles.label}>Full name</label>
            <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Primary phone</label>
            <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91xxxxxxxxxx" />
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Emergency contact 1</label>
            <input style={styles.input} value={contact1} onChange={(e) => setContact1(e.target.value)} placeholder="+91xxxxxxxxxx" />
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Emergency contact 2 (optional)</label>
            <input style={styles.input} value={contact2} onChange={(e) => setContact2(e.target.value)} placeholder="+91yyyyyyyyyy" />
          </div>

          <div style={styles.row}>
            <label style={styles.label}>Medical / allergy info (optional)</label>
            <textarea
              style={styles.textarea}
              value={medicalInfo}
              onChange={(e) => setMedicalInfo(e.target.value)}
              rows={3}
              placeholder="Diabetes, Allergies, Blood type..."
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button className="btn" type="submit" disabled={saving} style={styles.primary}>
              {saving ? "Saving…" : "Save profile"}
            </button>

            <button
              type="button"
              style={styles.ghost}
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

/* Styles (kept JS object so easy to copy-paste) */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    background: "#f8fafc",
    padding: 24,
  },
  card: {
    width: "100%",
    padding: "26px",
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
    border: "1px solid rgba(2,6,23,0.03)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 20,
    fontWeight: 800,
  },
  smallTag: {
    background: "#ecfdf5",
    color: "#065f46",
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: "#475569",
    fontSize: 14,
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #e6eef2",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid #e6eef2",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
  },
  primary: {
    background: "#007f5f",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    minWidth: 140,
  },
  ghost: {
    background: "transparent",
    color: "#0f172a",
    border: "1px solid #e6eef0",
    padding: "10px 14px",
    borderRadius: 10,
    cursor: "pointer",
  },
  error: {
    marginTop: 6,
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: 600,
  },
};