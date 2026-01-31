import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardActivity, getDashboardOverview } from "../api/http";

export default function Chat() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [dynamicHospitals, setDynamicHospitals] = useState([]);
  const navigate = useNavigate();
  const activityRef = useRef(null);
  const centerRef = useRef(null);
  const contextRef = useRef(null);

  const handleScrollTo = (ref) => {
    if (!ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return Promise.resolve(null);
    }
    setLocationStatus("locating");
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
          setCurrentLocation(coords);
          setLocationStatus("ready");
          resolve(coords);
        },
        (err) => {
          console.warn("dashboard geolocation failed", err);
          setLocationStatus("blocked");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const fetchNearbyHospitals = async (coords) => {
    if (!coords) return [];
    const radius = 30000;
    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius},${coords.lat},${coords.lon});
        way["amenity"="hospital"](around:${radius},${coords.lat},${coords.lon});
        relation["amenity"="hospital"](around:${radius},${coords.lat},${coords.lon});
      );
      out center tags;
    `;
    try {
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      const data = await res.json();
      const items = (data.elements || []).map((item) => {
        const lat = item.lat ?? item.center?.lat;
        const lon = item.lon ?? item.center?.lon;
        return {
          name: item.tags?.name || "Nearby Hospital",
          distanceKm: null,
          rating: item.tags?.rating || item.tags?.stars || "N/A",
          phone: item.tags?.phone || item.tags?.["contact:phone"] || "N/A",
          address: item.tags?.["addr:full"] || item.tags?.["addr:street"] || "",
          lat,
          lon,
          status: "available",
        };
      });
      return items;
    } catch (err) {
      console.warn("hospital lookup failed", err);
      return [];
    }
  };

  const calculateDistanceKm = (coords, hospital) => {
    if (!coords || hospital.lat == null || hospital.lon == null) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(hospital.lat - coords.lat);
    const dLon = toRad(hospital.lon - coords.lon);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(coords.lat)) * Math.cos(toRad(hospital.lat)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
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

  useEffect(() => {
    let mounted = true;
    const loadHospitals = async () => {
      const coords = await requestLocation();
      if (!mounted || !coords) return;
      const nearby = await fetchNearbyHospitals(coords);
      if (!mounted) return;
      const withDistance = nearby
        .map((hospital) => ({
          ...hospital,
          distanceKm: hospital.distanceKm ?? calculateDistanceKm(coords, hospital),
        }))
        .filter((hospital) => hospital.distanceKm == null || hospital.distanceKm <= 30);
      setDynamicHospitals(withDistance);
    };
    loadHospitals();
    const interval = setInterval(loadHospitals, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
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

  const defaultHospitals = [
    { name: "City Hospital", distanceKm: 12.4, rating: 4.8, status: "available" },
    { name: "Apollo Clinic", distanceKm: 18.2, rating: 4.7, status: "available" },
    { name: "Rakshak Care", distanceKm: 24.5, rating: 4.6, status: "available" },
    { name: "Medilife Specialty", distanceKm: 27.1, rating: 4.5, status: "available" },
  ];

  const hospitals = useMemo(() => {
    const source = dynamicHospitals.length > 0
      ? dynamicHospitals
      : (overview?.hospitals || defaultHospitals);
    const normalized = source.map((hospital) => ({
      ...hospital,
      rating: hospital.rating ?? 4.6,
      distanceKm: hospital.distanceKm ?? 22.0,
      phone: hospital.phone || "N/A",
      address: hospital.address || "",
      status: hospital.status || "available",
    }));
    return normalized
      .filter((hospital) => hospital.distanceKm <= 30)
      .sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);
  }, [dynamicHospitals, overview]);

  const hero = overview?.hero || {
    status: "Listening...",
    detectedBy: "Voice",
    location: "Bhandarkar, Pune",
    category: "Medical Emergency",
  };

  const user = overview?.user || { name: "Responder", premium: true };
  const displayLocation = currentLocation
    ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lon.toFixed(4)}`
    : hero.location;
  const locationQuery = encodeURIComponent(`${displayLocation} hospitals`);
  const mapUrl = currentLocation
    ? `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lon}&z=14&output=embed`
    : null;

  const handleHospitalView = (hospital) => {
    const query = encodeURIComponent(`${hospital.name} ${displayLocation}`);
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
          <button className="dashboard-icon" aria-label="Locate" onClick={requestLocation}>📍</button>
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
              <strong>{displayLocation}</strong>
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
          <div className="dashboard-hospital-list dashboard-hospital-scroll">
            {hospitals.map((hospital) => (
              <div key={hospital.name} className="dashboard-hospital-card">
                <div>
                  <div className="dashboard-hospital-name">{hospital.name}</div>
                  <div className="dashboard-hospital-meta">
                    {hospital.distanceKm} km • ⭐ {hospital.rating} • {hospital.status}
                  </div>
                  <div className="dashboard-hospital-meta">
                    {hospital.phone} {hospital.address ? `• ${hospital.address}` : ""}
                  </div>
                </div>
                <button className="dashboard-call" onClick={() => handleHospitalView(hospital)}>📞</button>
              </div>
            ))}
          </div>

          <div className="dashboard-map-card">
            {mapUrl ? (
              <iframe
                title="Dashboard location map"
                src={mapUrl}
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 14 }}
                loading="lazy"
              />
            ) : (
              <button className="dashboard-map-placeholder" type="button" onClick={requestLocation}>
                <div className="dashboard-map-pin" />
                <div className="dashboard-map-pin dashboard-map-pin--alt" />
                <div className="dashboard-map-hint">
                  {locationStatus === "locating" && "Detecting location…"}
                  {locationStatus === "blocked" && "Location blocked. Tap the pin icon to allow."}
                  {locationStatus === "unsupported" && "Location not supported."}
                  {locationStatus === "idle" && "Tap the pin icon to show your location."}
                </div>
              </button>
            )}
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
