import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getDashboardActivity, getDashboardOverview } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/overview", requireAuth, getDashboardOverview);
router.get("/activity", requireAuth, getDashboardActivity);

export default router;
