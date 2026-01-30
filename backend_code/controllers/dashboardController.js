import { logger } from "../utils/logger.js";

export async function getDashboardOverview(req, res, next) {
  try {
    const user = req.user || {};
    const displayName = user.Name || user.name || "Responder";
    const city = "Bhandarkar, Pune";

    const overview = {
      hero: {
        status: "Listening...",
        mode: "listening",
        detectedBy: "Voice",
        location: city,
        category: "Medical Emergency",
      },
      stats: [
        { label: "Medical", percent: 65 },
        { label: "Special Equipment", percent: 45 },
        { label: "Traffic Signals", percent: 14 },
        { label: "CPR Recorded", percent: 12 },
        { label: "Alarm", percent: 9 },
        { label: "Facts", percent: 13 },
        { label: "Reviews", percent: 67 },
        { label: "Cartoons", percent: 35 },
      ],
      hospitals: [
        { name: "City Hospital", distanceKm: 1.2, status: "away" },
        { name: "Apollo Clinic", distanceKm: 1.6, status: "away" },
        { name: "Rakshak Care", distanceKm: 2.1, status: "away" },
      ],
      user: {
        name: displayName,
        premium: true,
      },
    };

    res.json({ success: true, overview });
  } catch (err) {
    logger.error("getDashboardOverview failed", err);
    next(err);
  }
}
