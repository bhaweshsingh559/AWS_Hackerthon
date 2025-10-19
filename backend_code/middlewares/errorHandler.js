import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  logger.error(err);
  const status = err.status || 500;
  const body = { success: false, error: err.message || "Server error" };
  res.status(status).json(body);
}