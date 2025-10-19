import express from "express";
import requireAuth from "../middlewares/requireAuth.js";
import { updateContacts, getProfile, updateProfile } from "../controllers/userController.js";
const router = express.Router();

router.post("/contacts", requireAuth, updateContacts);
router.get("/profile", requireAuth, getProfile);
router.post("/profile", requireAuth, updateProfile);

export default router;