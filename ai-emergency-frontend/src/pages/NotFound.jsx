import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#ffffff",
        color: "#0f172a",
      }}
    >
      <h1 style={{ fontSize: "4rem", color: "#007f5f" }}>404</h1>
      <p>Page not found</p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: "#007f5f",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Back to Home
      </button>
    </div>
  );
}