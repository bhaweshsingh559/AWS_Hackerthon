// controllers/alertController.js
import { publishCustomAlert } from "../services/alertService.js";
import { logger } from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import { logIncident } from "../services/dynamoService.js";

export async function postAlert(req, res, next) {
  try {
    const { message, location, contacts } = req.body || {};
    if (!message) return res.status(400).json({ success: false, error: "message required" });

    const incidentId = uuidv4();
    try {
      await logIncident({ incidentId, text: message, parsed: { triggerAlert: true, alertMessage: message }, location, userId: req.user?.UserId || req.user?.userId || null });
    } catch (e) {
      logger.warn("logIncident failed", e);
    }
    const result = await publishCustomAlert({ incidentId, message, location, contacts });
    return res.json({ success: true, preview: result.preview, results: result.results });
  } catch (err) {
    logger.error("postAlert failed", err);
    next(err);
  }
}