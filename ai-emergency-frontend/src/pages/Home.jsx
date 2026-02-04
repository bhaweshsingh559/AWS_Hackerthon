import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-shell">
      <div className="home-card">
        <div className="home-badge">Rakshak AI</div>
        <h1 className="home-title">AI Emergency Assistant</h1>
        <p className="home-subtitle">
          Monitor, respond, and notify contacts instantly with a voice-first emergency hub.
        </p>

        <div className="home-actions">
          <button className="home-btn primary" onClick={() => navigate("/dashboard")}>
            Open Dashboard
          </button>
          <button className="home-btn" onClick={() => navigate("/profile")}>
            Manage Profile
          </button>
        </div>
      </div>
    </div>
  );
}
