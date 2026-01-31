import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getWearableSummary } from "../controllers/wearablesController.js";

const router = express.Router();

router.get("/summary", requireAuth, getWearableSummary);

export default router;
