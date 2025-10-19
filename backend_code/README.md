backend/
├─ package.json
├─ Dockerfile
├─ docker-compose.yml
├─ .env.example
├─ server.js
├─ src/
│  ├─ controllers/
│  │  ├─ authController.js
│  │  ├─ userController.js
│  │  └─ emergencyController.js
│  ├─ middlewares/
│  │  ├─ errorHandler.js
│  │  └─ requireAuth.js
│  ├─ services/
│  │  ├─ userService.js
│  │  ├─ dynamoService.js
│  │  ├─ bedrockService.js
│  │  └─ alertService.js
│  ├─ utils/
│  │  ├─ auth.js
│  │  └─ logger.js
│  └─ routes/
│     ├─ authRoutes.js
│     ├─ userRoutes.js
│     └─ emergencyRoutes.js
└─ README.md

# Rakshak Backend (production-ready template)

## Overview
This repo provides an Express-based backend with:
- Auth (register/login/me)
- Profile & emergency contacts persistence (DynamoDB)
- Analyze/chat endpoints that call an LLM (Bedrock stub included)
- SNS + Twilio (SMS & WhatsApp) for alert delivery
- SOS manual endpoint

> You must configure AWS credentials and Twilio keys.

## Setup (local)
1. Copy `.env.example` to `.env` and fill values.
2. Ensure DynamoDB tables exist:
   - `Users` table with primary key matching `USERS_TABLE_KEY` (defaults to `UserId`).
   - `EmergencyIncidents` table with primary key `IncidentId`.
   You can use AWS Console or a script to create tables.
3. Install & run:
   ```bash
   npm ci
   npm run dev