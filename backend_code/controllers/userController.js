import { updateUserProfile, getUserById } from "../services/userService.js";
import { logger } from "../utils/logger.js";

export async function updateContacts(req, res, next) {
  try {
    const user = req.user;
    const { contacts } = req.body || {};
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, error: "contacts must be an array" });
    }
    const normalized = contacts.map(c => String(c).trim()).filter(Boolean);
    const userKey = user.UserId || user.userId || user.Email || user.email;
    const updated = await updateUserProfile(userKey, { emergencyContacts: normalized });
    const safe = {
      userId: updated.UserId || updated.userId || userKey,
      emergencyContacts: updated.EmergencyContacts ? JSON.parse(updated.EmergencyContacts) : []
    };
    res.json({ success: true, user: safe });
  } catch (err) {
    logger.error("updateContacts failed", err);
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const user = req.user;
    const safe = {
      userId: user.UserId || user.userId,
      email: user.Email || user.email,
      name: user.Name || user.name,
      phone: user.Phone || user.phone,
      emergencyContacts: user.EmergencyContacts ? JSON.parse(user.EmergencyContacts) : [],
      location: user.Location ? JSON.parse(user.Location) : null,
    };
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const user = req.user;
    const updates = req.body || {};
    const userKey = user.UserId || user.userId || user.Email || user.email;
    const result = await updateUserProfile(userKey, updates);
    res.json({ success: true, user: { 
      userId: result.UserId || result.userId,
      email: result.Email || result.email,
      name: result.Name || result.name,
      phone: result.Phone || result.phone,
      emergencyContacts: result.EmergencyContacts ? JSON.parse(result.EmergencyContacts) : []
    } });
  } catch (err) {
    next(err);
  }
}