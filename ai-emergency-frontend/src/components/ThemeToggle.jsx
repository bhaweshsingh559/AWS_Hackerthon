// src/components/ThemeToggle.jsx
import React from "react";

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        border: "none",
        background: "transparent",
        cursor: "pointer",
        fontSize: 18,
        color: theme === "dark" ? "#f1f5f9" : "#0f172a",
      }}
      title="Toggle theme"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}