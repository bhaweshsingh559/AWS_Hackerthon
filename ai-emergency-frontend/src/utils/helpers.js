// src/utils/helpers.js
export function normalizePhone(phone) {
  if (!phone) return "";
  let s = String(phone).trim().replace(/\s+/g, "");
  // if starts with 0 and length 11 (India) -> +91
  if (/^\d{10}$/.test(s)) return "+91" + s;
  if (/^\+\d{7,15}$/.test(s)) return s;
  return s;
}

export async function getGeolocation(timeout = 8000) {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}

export function makeMapsLink(location) {
  if (!location) return "";
  const lat = Number(location.lat ?? location.latitude);
  const lon = Number(location.lon ?? location.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return "";
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lon.toFixed(6)}`;
}