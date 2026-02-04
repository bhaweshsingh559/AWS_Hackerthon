import express from "express";
import { getNearbyHospitals, getNearbyPoliceStations } from "../controllers/placesController.js";

const router = express.Router();

router.get("/nearby", getNearbyHospitals);
router.get("/police", getNearbyPoliceStations);

export default router;
