import express from "express";
import { v4 as uuidv4 } from "uuid";
import { analyzeSymptoms, assistantChat, classifyIncident, detectEmergencyText } from "../controllers/emergencyController.js";
import { publishCustomAlert } from "../services/alertService.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = express.Router();

router.post("/analyze", requireAuth, analyzeSymptoms);

router.post("/chat", requireAuth, assistantChat);

router.post("/detect", requireAuth, detectEmergencyText);
router.post("/classify", requireAuth, classifyIncident);

router.post("/alert", requireAuth, async (req, res, next) => {
  try {
    const { message, location, contacts } = req.body || {};

    if (!message) {
      return res.status(400).json({ success: false, error: "message is required" });
    }

    const incidentId = uuidv4();

    const resp = await publishCustomAlert({
      incidentId,
      message,
      location,
      contacts,
    });

    res.json({
      success: true,
      preview: message,
      results: resp.results || resp,
    });
  } catch (err) {
    console.error("Error in /alert:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
});

export default router;
