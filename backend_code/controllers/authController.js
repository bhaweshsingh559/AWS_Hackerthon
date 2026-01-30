
import { logger } from "../utils/logger.js";
import { createUser, getUserByEmail } from "../services/userService.js";
import { signToken } from "../utils/auth.js";
import { subscribePhoneToTopic } from "../services/snsSubscribeService.js";

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: "email and password required" });

    const { getUserByEmail, verifyPassword } = await import("../services/userService.js").then(m => m);
    const user = await getUserByEmail(email);
    if (!user) return res.status(400).json({ success: false, error: "invalid credentials" });

    const ok = await verifyPassword(user, password);
    if (!ok) return res.status(400).json({ success: false, error: "invalid credentials" });

    const token = signToken({ userId: user.UserId || user.userId });
    const safeUser = {
      userId: user.UserId || user.userId,
      email: user.Email || user.email,
      name: user.Name || user.name,
      phone: user.Phone || user.phone,
      medicalInfo: user.MedicalInfo || user.medicalInfo || "",
      bloodGroup: user.BloodGroup || user.bloodGroup || "",
      address: user.Address || user.address || "",
      emergencyContacts: user.EmergencyContacts ? JSON.parse(user.EmergencyContacts) : []
    };
    res.json({ success: true, user: safeUser, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const u = req.user;
    const safe = {
      userId: u.UserId || u.userId,
      email: u.Email || u.email,
      name: u.Name || u.name,
      phone: u.Phone || u.phone,
      medicalInfo: u.MedicalInfo || u.medicalInfo || "",
      bloodGroup: u.BloodGroup || u.bloodGroup || "",
      address: u.Address || u.address || "",
      emergencyContacts: u.EmergencyContacts ? JSON.parse(u.EmergencyContacts) : [],
      location: u.Location ? JSON.parse(u.Location) : null
    };
    res.json({ success: true, user: safe });
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const {
      name,
      email,
      password,
      phone,
      location,
      emergencyContacts,
      medicalInfo,
      bloodGroup,
      address,
    } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, error: "email and password required" });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({ success: false, error: "email already registered" });

    const user = await createUser({
      name,
      email,
      password,
      phone,
      location,
      emergencyContacts,
      medicalInfo,
      bloodGroup,
      address,
    });

    // After user created, try to subscribe emergency contacts to SNS topic (best-effort)
    const topic = process.env.SNS_TOPIC_ARN || process.env.SNS_TOPIC || null;
    if (topic && Array.isArray(emergencyContacts)) {
      for (const c of emergencyContacts) {
        try {
          await subscribePhoneToTopic(c, topic);
        } catch (e) {
          // non-fatal
          console.warn("subscribePhoneToTopic failed", e?.message || e);
        }
      }
    }

    const token = signToken({ userId: user.userId, email });
    return res.json({ success: true, user, token });
  } catch (err) {
    next(err);
  }
}
