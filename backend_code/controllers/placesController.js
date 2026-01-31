import { logger } from "../utils/logger.js";

const GOOGLE_PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchPlaceDetails(placeId) {
  const fields = [
    "name",
    "rating",
    "formatted_address",
    "formatted_phone_number",
    "international_phone_number",
    "geometry",
  ].join(",");
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_PLACES_KEY}`;
  const json = await fetchJson(url);
  return json.result || null;
}

export async function getNearbyHospitals(req, res, next) {
  try {
    if (!GOOGLE_PLACES_KEY) {
      return res.status(400).json({ success: false, error: "GOOGLE_PLACES_API_KEY not configured" });
    }
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ success: false, error: "lat and lon are required" });
    }
    const radius = Number(req.query.radius || 30000);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=hospital&key=${GOOGLE_PLACES_KEY}`;
    const json = await fetchJson(url);
    const results = (json.results || []).slice(0, 8);
    const details = await Promise.all(results.map((item) => fetchPlaceDetails(item.place_id)));
    const hospitals = details.filter(Boolean).map((detail) => ({
      name: detail.name,
      rating: detail.rating ?? null,
      phone: detail.international_phone_number || detail.formatted_phone_number || "N/A",
      address: detail.formatted_address || "",
      lat: detail.geometry?.location?.lat ?? null,
      lon: detail.geometry?.location?.lng ?? null,
      status: "available",
    }));
    return res.json({ success: true, hospitals });
  } catch (err) {
    logger.error("getNearbyHospitals failed", err);
    next(err);
  }
}
