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

export async function getDashboardActivity(req, res, next) {
  try {
    const activity = [
      {
        title: "Emergency drill completed",
        category: "Training",
        status: "Resolved",
        occurredAt: "2025-01-20T09:15:00Z",
      },
      {
        title: "Medical alert flagged",
        category: "Medical",
        status: "Escalated",
        occurredAt: "2025-01-18T15:42:00Z",
      },
      {
        title: "Safety check-in sent",
        category: "Check-in",
        status: "Delivered",
        occurredAt: "2025-01-16T06:30:00Z",
      },
      {
        title: "Incident review uploaded",
        category: "Report",
        status: "Completed",
        occurredAt: "2025-01-14T11:05:00Z",
      },
    ];

    res.json({ success: true, activity });
  } catch (err) {
    logger.error("getDashboardActivity failed", err);
    next(err);
  }
}
