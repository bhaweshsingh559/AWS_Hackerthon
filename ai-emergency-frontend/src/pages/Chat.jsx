import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardActivity, getDashboardOverview } from "../api/http";

export default function Chat() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const activityRef = useRef(null);
  const centerRef = useRef(null);
  const contextRef = useRef(null);

  const handleScrollTo = (ref) => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDownload = async () => {
    try {
      const resp = await getDashboardActivity();
      const rows = resp?.activity || [];
      if (rows.length === 0) return;
      const header = Object.keys(rows[0]);
      const csv = [
        header.join(","),
        ...rows.map((row) =>
          header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "dashboard-activity.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("dashboard activity download failed", err);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await getDashboardOverview();
        if (mounted) setOverview(resp.overview || null);
      } catch (err) {
        console.warn("dashboard overview failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    return overview?.stats || [
      { label: "Medical", percent: 65 },
      { label: "Special Equipment", percent: 45 },
      { label: "Traffic Signals", percent: 14 },
      { label: "CPR Recorded", percent: 12 },
      { label: "Alarm", percent: 9 },
      { label: "Facts", percent: 13 },
      { label: "Reviews", percent: 67 },
      { label: "Cartoons", percent: 35 },
    ];
  }, [overview]);

  const hospitals = overview?.hospitals || [
    { name: "City Hospital", distanceKm: 1.2, status: "away" },
    { name: "Apollo Clinic", distanceKm: 1.6, status: "away" },
    { name: "Rakshak Care", distanceKm: 2.1, status: "away" },
  ];

  const hero = overview?.hero || {
    status: "Listening...",
    detectedBy: "Voice",
    location: "Bhandarkar, Pune",
    category: "Medical Emergency",
  };

  const user = overview?.user || { name: "Responder", premium: true };
  const locationQuery = encodeURIComponent(`${hero.location} hospitals`);

  const handleHospitalView = (hospitalName) => {
    const query = encodeURIComponent(`${hospitalName} ${hero.location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-logo">
            <span className="dashboard-logo-mark" />
          </div>
          <div>
            <div className="dashboard-logo">Rakshak</div>
            <div className="dashboard-subtitle">AI Emergency Assistant</div>
          </div>
        </div>
        <div className="dashboard-actions">
          <button
            className="dashboard-icon"
            aria-label="Notifications"
            onClick={() => handleScrollTo(contextRef)}
          >
            🔔
          </button>
          <button className="dashboard-icon" aria-label="Theme">🌓</button>
          <button className="dashboard-avatar" onClick={() => navigate("/profile")} aria-label="Profile">
            👤
          </button>
          {user.premium && <span className="dashboard-pill">Premium</span>}
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-panel dashboard-left" ref={activityRef}>
          <div className="dashboard-panel-title">Previous Activity</div>
          <div className="dashboard-stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="dashboard-card">
                <div className="dashboard-card-label">{stat.label.toUpperCase()}</div>
                <div className="dashboard-card-value">{stat.percent}%</div>
                <div className="dashboard-bar">
                  <span style={{ width: `${stat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button
            className="dashboard-download"
            aria-label="Download activity"
            onClick={handleDownload}
          >
            ⬇️
          </button>
        </div>

        <div className="dashboard-center" ref={centerRef}>
          <div className="orb-shell">
            <div className="orb-outer" />
            <div className="orb-core">
              <div className="orb-wave" />
              <div className="orb-wave orb-wave--alt" />
              <div className="orb-particles" />
            </div>
          </div>
          <div className="orb-status">{hero.status}</div>
          <button className="dashboard-mic">🎙️</button>
          {loading && <div className="dashboard-hint">Syncing emergency context…</div>}
        </div>

        <div className="dashboard-panel dashboard-right" ref={contextRef}>
          <div className="dashboard-panel-title">Context</div>
          <div className="dashboard-context-card">
            <div className="dashboard-context-row">
              <span>Detected by</span>
              <strong>{hero.detectedBy}</strong>
            </div>
            <div className="dashboard-context-row">
              <span>Location</span>
              <strong>{hero.location}</strong>
            </div>
            <div className="dashboard-context-row">
              <span>Category</span>
              <strong>{hero.category}</strong>
            </div>
          </div>

          <div className="dashboard-panel-title dashboard-title-inline">
            Nearest Hospitals
            <button
              className="dashboard-link"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${locationQuery}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              View all
            </button>
          </div>
          <div className="dashboard-hospital-list">
            {hospitals.map((hospital) => (
              <div key={hospital.name} className="dashboard-hospital-card">
                <div>
                  <div className="dashboard-hospital-name">{hospital.name}</div>
                  <div className="dashboard-hospital-meta">{hospital.distanceKm} km / {hospital.status}</div>
                </div>
                <button className="dashboard-call" onClick={() => handleHospitalView(hospital.name)}>📞</button>
              </div>
            ))}
          </div>

          <div className="dashboard-map-card">
            <div className="dashboard-map-placeholder">
              <div className="dashboard-map-pin" />
              <div className="dashboard-map-pin dashboard-map-pin--alt" />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-nav">
        <button className="nav-icon" onClick={() => navigate("/")}>🏠</button>
        <button className="nav-icon active" onClick={() => navigate("/chat")}>💬</button>
        <button className="nav-icon nav-sos" onClick={() => handleScrollTo(centerRef)}>SOS</button>
        <button className="nav-icon" onClick={() => handleScrollTo(activityRef)}>📜</button>
        <button className="nav-icon" onClick={() => navigate("/profile")}>⚙️</button>
      </div>

      <div className="dashboard-shortcuts">
        <div className="dashboard-shortcut-card">
          <div>
            <div className="shortcut-title">Home</div>
            <div className="shortcut-subtitle">Overview & quick actions</div>
          </div>
          <button className="dashboard-call" onClick={() => navigate("/")}>Open</button>
        </div>
        <div className="dashboard-shortcut-card">
          <div>
            <div className="shortcut-title">Profile</div>
            <div className="shortcut-subtitle">Update emergency contacts</div>
          </div>
          <button className="dashboard-call" onClick={() => navigate("/profile")}>Manage</button>
        </div>
      </div>
    </div>
  );
}
