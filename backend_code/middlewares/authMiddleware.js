import { verifyToken } from "../utils/auth.js";
import { getUserById } from "../services/userService.js";
import { logger } from "../utils/logger.js";

export default async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: "Missing token" });
    }
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ success: false, error: "Invalid token" });

    // payload must include userId or email
    let user = null;
    if (payload.userId) {
      user = await getUserById(payload.userId);
    } else if (payload.email) {
      user = await getUserById(payload.email) || (await import("../services/userService.js")).getUserByEmail(payload.email);
    }

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid user" });
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error("requireAuth error", err);
    next(err);
  }
}