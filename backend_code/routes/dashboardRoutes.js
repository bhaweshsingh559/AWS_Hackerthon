import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { getDashboardOverview } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/overview", requireAuth, getDashboardOverview);

export default router;
