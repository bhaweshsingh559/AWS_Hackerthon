// utils/logger.js
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "..", "logs");

const { combine, timestamp, printf, errors, splat, json, colorize } = winston.format;

const humanFormat = combine(
  timestamp(),
  errors({ stack: true }),
  splat(),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ""}${metaStr}`;
  })
);

const jsonFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const transports = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || "debug",
    format: combine(colorize(), humanFormat),
  }),

  new DailyRotateFile({
    filename: path.join(LOG_DIR, "app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    level: process.env.FILE_LOG_LEVEL || "info",
    format: humanFormat,
    zippedArchive: false,
  }),

  new DailyRotateFile({
    filename: path.join(LOG_DIR, "app-json-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    level: process.env.FILE_LOG_LEVEL || "info",
    format: jsonFormat,
    zippedArchive: false,
  }),
];

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  transports,
  exitOnError: false,
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: reason?.stack || reason });
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err?.message, stack: err?.stack });
});

export default logger;