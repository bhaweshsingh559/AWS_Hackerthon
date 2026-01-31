import { logger } from "../utils/logger.js";

export async function getWearableSummary(req, res, next) {
  try {
    const summary = {
      provider: "Not connected",
      lastSync: null,
      metrics: [
        { label: "Heart rate", value: 78, unit: "bpm", trend: "steady" },
        { label: "SpO₂", value: 97, unit: "%", trend: "stable" },
        { label: "Stress", value: 32, unit: "%", trend: "low" },
        { label: "Steps", value: 4820, unit: "steps", trend: "active" },
        { label: "Walking", value: 4.2, unit: "km", trend: "today" },
        { label: "Running", value: 1.1, unit: "km", trend: "today" },
      ],
      supportedProviders: ["Apple Watch", "Noise", "boAt", "Fitbit"],
    };

    res.json({ success: true, summary });
  } catch (err) {
    logger.error("getWearableSummary failed", err);
    next(err);
  }
}
