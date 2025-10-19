import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  
  const navigate = useNavigate();

  return (
    <div className="home-container" style={styles.container}>
      <h1 style={styles.title}>🚑 Rakshak AI</h1>
      <p style={styles.subtitle}>
        Your Emergency AI Assistant. Analyze, respond and alert instantly.
      </p>

      <div style={styles.actions}>
        <button style={styles.primary} onClick={() => navigate("/chat")}>
          💬 Open Chat
        </button>
        <button style={styles.secondary} onClick={() => navigate("/sos")}>
          🚨 SOS Page
        </button>
        <button style={styles.link} onClick={() => navigate("/profile")}>
          Manage Profile
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#ffffff",
    color: "#0f172a",
    textAlign: "center",
    padding: "6rem 1rem",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: "3rem",
    fontWeight: "800",
    marginBottom: "1rem",
    color: "#007f5f",
  },
  subtitle: {
    fontSize: "1.2rem",
    color: "#4b5563",
    maxWidth: 600,
  },
  actions: { marginTop: "2rem", display: "flex", flexDirection: "column", gap: 10 },
  primary: {
    background: "#007f5f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 16,
    cursor: "pointer",
  },
  secondary: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 16,
    cursor: "pointer",
  },
  link: {
    background: "none",
    color: "#007f5f",
    border: "1px solid #007f5f",
    borderRadius: 8,
    padding: "12px 28px",
    fontSize: 16,
    cursor: "pointer",
  },
};