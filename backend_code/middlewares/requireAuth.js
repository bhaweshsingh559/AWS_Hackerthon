import { verifyToken } from "../utils/auth.js";
import { getUserById } from "../services/userService.js";
import { logger } from "../utils/logger.js";

export default async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Missing token" });
    }
    const token = auth.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload || !payload.userId) return res.status(401).json({ success: false, error: "Invalid token" });

    // attach user raw object from DynamoDB (best-effort)
    const user = await getUserById(payload.userId);
    if (!user) {
      logger.warn("requireAuth: user not found for token", { userId: payload.userId });
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}