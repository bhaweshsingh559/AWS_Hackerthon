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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome back</h2>
          <div className="auth-tag">Secure access</div>
        </div>
        <p className="auth-subtitle">Sign in with your email and password to access the SOS & chat assistant.</p>

        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          <div className="auth-grid">
            <div className="auth-field auth-full">
              <label className="auth-label">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>

            <div className="auth-field auth-full">
              <label className="auth-label">Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-actions">
            <button type="submit" className="auth-primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setEmail(""); setPassword(""); setError(null); }}
              className="auth-link"
            >
              Clear
            </button>
          </div>
        </form>

        <div style={{ marginTop: 18, fontSize: 14, color: "var(--muted)" }}>
          <div>
            If you are a new user,{" "}
            <Link to="/register" className="auth-link">
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
