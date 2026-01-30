import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pino from "pino";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "512kb" }));

app.get("/", (req, res) => res.json({ status: "ok", service: "rakshak-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
});
