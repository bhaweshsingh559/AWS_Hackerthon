// src/components/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { postRegister } from "../api/http"; // make sure this exists
import { useAuth } from "../context/AuthContext.jsx"; // optional

export default function Register({ onRegistered }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // try to use auth context if present
  let auth = null;
  try { auth = useAuth(); } catch {}

  async function applyAuthAndNavigate(user, token) {
    if (auth && typeof auth.setAuth === "function") {
      auth.setAuth({ user, token });
    } else if (auth && typeof auth.setUser === "function" && typeof auth.setToken === "function") {
      try { auth.setToken(token); } catch {}
      try { auth.setUser(user); } catch {}
    } else if (typeof onRegistered === "function") {
      onRegistered(user, token);
    } else {
      try {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      } catch {}
    }
    navigate("/chat", { replace: true });
  }

  async function handleRegister(e) {
    e?.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password required.");
      return;
    }

    const contactsArray = (emergencyContacts || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (contactsArray.length === 0) {
      setError("Provide at least one emergency contact (comma separated).");
      return;
    }

    setLoading(true);
    try {
      const body = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
        emergencyContacts: contactsArray,
      };
      const resp = await postRegister(body);
      if (resp?.success && resp?.token) {
        await applyAuthAndNavigate(resp.user || { email: body.email, name: body.name }, resp.token);
      } else {
        setError(resp?.error || "Registration failed");
      }
    } catch (err) {
      console.error("register error", err);
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h2 style={styles.title}>Create account</h2>
          <div style={styles.smallTag}>Emergency contacts required</div>
        </div>

        <p style={styles.subtitle}>Register and add at least one emergency contact (comma separated). This will be used by SOS.</p>

        <form onSubmit={handleRegister} style={{ width: "100%" }}>
          <label style={styles.label}>Full name</label>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name (optional)" />

          <label style={styles.label}>Email</label>
          <input type="email" style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />

          <label style={styles.label}>Phone (you)</label>
          <input style={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91xxxxxxxxxx (optional)" />

          <label style={styles.label}>Password</label>
          <input type="password" style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a secure password" required />

          <label style={styles.label}>Emergency contacts (comma separated) <span style={{ fontSize: 12, color: "#64748b" }}>(required)</span></label>
          <input style={styles.input} value={emergencyContacts} onChange={(e) => setEmergencyContacts(e.target.value)} placeholder="+91..., +91..." />

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actionsRow}>
            <button type="submit" style={{ ...styles.primary, opacity: loading ? 0.85 : 1 }} disabled={loading}>
              {loading ? "Creating..." : "Register"}
            </button>

            <Link to="/login" style={styles.ghostLink}>Already registered? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Styles (consistent with Login) */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 640,
    padding: 28,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
    border: "1px solid rgba(2,6,23,0.03)",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 24,
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
    marginTop: 8,
    marginBottom: 16,
    color: "#475569",
    fontSize: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
    marginTop: 10,
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
  actionsRow: {
    display: "flex",
    gap: 12,
    marginTop: 16,
    alignItems: "center",
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
  ghostLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px 14px",
    borderRadius: 10,
    textDecoration: "none",
    color: "#007f5f",
    border: "1px solid #e6eef0",
    background: "transparent",
  },
  error: {
    marginTop: 10,
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: 600,
  },
};