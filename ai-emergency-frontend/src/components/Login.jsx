// src/components/Login.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { postLogin } from "../api/http"; // your API helper
import { useAuth } from "../context/AuthContext.jsx"; // optional, if you use it

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // try to get auth setter (if provider exists). If not, we'll fallback to localStorage.
  let auth = null;
  try {
    auth = useAuth();
  } catch (e) {
    auth = null;
  }

  async function handleLogin(e) {
    e?.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password required.");
      return;
    }
    setLoading(true);

    try {
      const payload = { email: email.trim().toLowerCase(), password };
      const resp = await postLogin(payload);

      if (resp?.success && resp?.token) {
        // 1) Persist token + user locally
        try {
          localStorage.setItem("token", resp.token);
          localStorage.setItem("user", JSON.stringify(resp.user || { email: payload.email }));
        } catch (e) {
          console.warn("localStorage set failed", e);
        }

        // 2) If auth context is present, update it
        try {
          if (auth && typeof auth.setAuth === "function") {
            auth.setAuth({ token: resp.token, user: resp.user });
          } else if (auth && typeof auth.setToken === "function" && typeof auth.setUser === "function") {
            // older context shape
            auth.setToken(resp.token);
            auth.setUser(resp.user);
          }
        } catch (e) {
          // ignore
        }

        // 3) FORCE a full page navigation to home and reload so app re-initializes
        // Using replace avoids back-button returning to login.
        window.location.replace("/"); // navigates and reloads the page
        return;
      } else {
        setError(resp?.error || "Invalid credentials");
      }
    } catch (err) {
      console.error("login error", err);
      setError(err?.body?.error || err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in with your email and password to access the SOS & chat assistant.</p>

        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          {error && <div style={styles.error}>{error}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="submit" style={styles.primary} disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setEmail(""); setPassword(""); setError(null); }}
              style={styles.ghost}
            >
              Clear
            </button>
          </div>
        </form>

        <div style={styles.footer}>
          <div>
            If you are a new user,{" "}
            <Link to="/register" style={styles.link}>
              register first
            </Link>
            .
          </div>
          <div style={{ marginTop: 8 }}>
            Forgot password? (Not implemented)
          </div>
        </div>
      </div>
    </div>
  );
}

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
    maxWidth: 520,
    padding: "28px",
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 12px 30px rgba(2,6,23,0.08)",
    border: "1px solid rgba(2,6,23,0.03)",
  },
  title: { margin: 0, color: "#0f172a", fontSize: 24, fontWeight: 800 },
  subtitle: { marginTop: 8, marginBottom: 16, color: "#475569", fontSize: 14 },
  label: { display: "block", fontSize: 13, color: "#475569", marginBottom: 6, marginTop: 10 },
  input: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e6eef2", fontSize: 15, outline: "none" },
  primary: { background: "#007f5f", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 10, cursor: "pointer", fontWeight: 700, minWidth: 120 },
  ghost: { background: "transparent", color: "#0f172a", border: "1px solid #e6eef0", padding: "10px 14px", borderRadius: 10, cursor: "pointer" },
  error: { marginTop: 10, color: "#b91c1c", fontSize: 14, fontWeight: 600 },
  footer: { marginTop: 18, fontSize: 14, color: "#475569" },
  link: { color: "#007f5f", fontWeight: 700, textDecoration: "none" },
};