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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [address, setAddress] = useState("");
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
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
        bloodGroup: bloodGroup || null,
        medicalInfo: medicalInfo.trim() || null,
        address: address.trim() || null,
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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Create account</h2>
          <div className="auth-tag">Emergency contacts required</div>
        </div>

        <p className="auth-subtitle">Register and add at least one emergency contact (comma separated). This will be used by SOS.</p>

        <form onSubmit={handleRegister} style={{ width: "100%" }}>
          <div className="auth-grid">
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <input className="auth-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name (optional)" />
            </div>

            <div className="auth-field">
              <label className="auth-label">Phone (you)</label>
              <input className="auth-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91xxxxxxxxxx (optional)" />
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>

            <div className="auth-field">
              <label className="auth-label">Blood group</label>
              <select className="auth-input" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                <option value="">Select blood group (optional)</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input type="password" className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a secure password" required />
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <input type="password" className="auth-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required />
            </div>

            <div className="auth-field auth-full">
              <label className="auth-label">Medical info (allergies, conditions)</label>
              <textarea
                className="auth-input"
                style={{ minHeight: 88 }}
                value={medicalInfo}
                onChange={(e) => setMedicalInfo(e.target.value)}
                placeholder="e.g., asthma, peanut allergy, diabetes"
              />
            </div>

            <div className="auth-field auth-full">
              <label className="auth-label">Home address</label>
              <input
                className="auth-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City (optional)"
              />
            </div>

            <div className="auth-field auth-full">
              <label className="auth-label">Emergency contacts (comma separated) <span style={{ fontSize: 12 }}>(required)</span></label>
              <input className="auth-input" value={emergencyContacts} onChange={(e) => setEmergencyContacts(e.target.value)} placeholder="+91..., +91..." />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-actions">
            <button type="submit" className="auth-primary" disabled={loading}>
              {loading ? "Creating..." : "Register"}
            </button>
            <Link to="/login" className="auth-link">Already registered? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
