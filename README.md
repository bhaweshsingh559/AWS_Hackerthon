# Rakshak — AI Emergency Assistant

Rakshak is an **AWS Bedrock AI-powered emergency response system** built to assist users during critical situations.  
It provides instant alerting via **SMS, WhatsApp, and AWS SNS** to registered emergency contacts,  
along with a chat-based assistant and live location tracking.

---

## Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Project Structure](#-project-structure)
5. [Environment Variables](#-environment-variables)
6. [Local Development Setup](#-local-development-setup)
7. [Production Deployment (Docker)](#-production-deployment-docker)
8. [Testing Alerts (Postman Example)](#-testing-alerts-postman-example)
9. [Common Issues & Fixes](#-common-issues--fixes)
10. [Helpful Commands](#-helpful-commands)
11. [License](#-license)

---

##  Overview

Rakshak is designed to save lives by providing:
- Real-time emergency alerts via **SMS / WhatsApp / AWS SNS**
- Location sharing via **Google Maps**
- Secure authentication and profile management
- Easy-to-use **chat interface** for reporting and assistance

This project contains both:
-  **Backend (Node.js)** – handles alerts, authentication, and AWS/Twilio integrations  
-  **Frontend (React + Vite)** – user interface for chat, SOS, and profile management  

---

## Features

✅ User login & authentication  
✅ Chat-based assistant (AI-powered emergency helper)  
✅ SOS button to trigger alerts  
✅ Location tracking (via browser Geolocation API)  
✅ SMS and WhatsApp alerts (via Twilio)  
✅ AWS SNS integration for verified alerts  
✅ Fully containerized with Docker for production  

---

## Tech Stack

| Layer       | Technology Used |
|--------------|----------------|
| **Frontend** | React (Vite) + Tailwind CSS |
| **Backend**  | Node.js + Express |
| **Cloud Services** | AWS SNS, AWS DynamoDB , Bedrock, Lex, Lamda|
| **Messaging** | Twilio (SMS & WhatsApp) |
| **Containerization** | Docker + Nginx + Compose |

---

## Project Structure
AWS_Hackerthon/
│
├── backend_code/                 # Node.js backend (Express + SNS + Twilio)
│   ├── Dockerfile
│   ├── server.js
│   ├── src/
│   ├── package.json
│   └── .env
│
├── ai-emergency-frontend/        # React + Vite frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   └── dist/                     # built output
│
├── docker/
│   └── nginx/
│       └── frontend.conf         # nginx config for serving React app
│
├── Dockerfile.frontend           # frontend Docker build file
├── docker-compose.prod.yml       # production docker-compose
├── .env.prod                     # production environment variables
└── README.md                     # this file

---
## Docker CMD
```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f backend                      
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml down
```

## Environment Variables

Create a file named **`.env.prod`** at the root of your project.

```bash
# --- App Settings ---
PORT=3002
NODE_ENV=production
VITE_API_BASE_URL=/api
```

---

## Local Development Setup

You can run both backend and frontend locally for development and testing.

### 1️ Backend Setup

```bash
cd backend_code
cp .env.example .env   # or manually create .env using values from .env.prod
npm install
npm run dev
```

> The backend will start on **http://localhost:3002**  
> It handles APIs for authentication, SOS alerts, and Twilio/AWS SNS communication.

---

### 2 Frontend Setup

```bash
cd ai-emergency-frontend
cp .env.example .env   # or create .env manually
npm install
npm run dev
```

> The frontend will start on **http://localhost:5173** (default Vite port)

Make sure your `.env` file inside the frontend contains:

```bash
VITE_API_BASE_URL=http://localhost:3002/api
```

This ensures your frontend can communicate properly with the backend APIs during development.

---

### Access the App

After both servers are running:
- Frontend → http://localhost:5173  
- Backend API → http://localhost:3002/api

You can now log in, trigger SOS alerts, and test message sending in a local environment.

---

## Prerequisites

Before running the project locally, make sure you have installed:

| Tool | Version | Description |
|------|----------|-------------|
| Node.js | ≥ 18.x | Required for both frontend and backend |
| npm or yarn | ≥ 9.x | Dependency manager |
| Docker | ≥ 24.x | For running containers (optional for local dev) |
| AWS CLI | Optional | For managing SNS & DynamoDB |
| Twilio Account | Required | For WhatsApp/SMS sandbox testing |

---

## Backend .env Example

Create `backend_code/.env` file:

```bash
env
```

---

##  Frontend .env Example

Create `ai-emergency-frontend/.env` file:

```bash
VITE_API_BASE_URL=http://localhost:3002/api
VITE_APP_NAME=Rakshak AI
VITE_ENV=development
```

---

## Testing Local SOS Alerts

Once backend and frontend are running:

1. Go to **http://localhost:5173**
2. Login or register a new user
3. Add your verified Twilio or AWS SNS phone number under **Profile > Emergency Contacts**
4. Click the **SOS** button  
   - Backend logs should show Twilio & SNS messages being published  
   - Verified numbers should receive alerts via SMS and WhatsApp

---

## Common Dev Issues

| Issue | Cause | Fix |
|-------|--------|-----|
| `CORS error` in frontend | Backend not allowing frontend origin | Update backend CORS config |
| `EACCES: permission denied, open '/app/logs/...` | Log directory missing or locked | Run `mkdir -p backend_code/logs && chmod 777 backend_code/logs` |
| `Twilio number unverified` | Trial account limitation | Verify phone in Twilio Console |
| `AWS SNS sandbox` | You’re in sandbox mode | Add verified numbers in AWS SNS Console |
| Backend not responding | Wrong `.env` setup | Check PORT and API base URLs |

---

## Final Tips

Use `npm run dev` in both backend and frontend folders for live reload.  
Use Postman or curl to test backend APIs directly.  
Keep `.env` files private — never commit them to GitHub.  
Once verified locally, use Docker for production deployment.


---

## License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it, provided proper credit is given.  
See the [LICENSE](./LICENSE) file for full details.

---

## Developer Info

**Developed by:**  
🚀 **Bhawesh Pratap Singh**

**GitHub:** [github.com/bhaweshpratap](https://github.com/bhaweshpratap)  
**LinkedIn:** [linkedin.com/in/bhaweshpratapsingh](www.linkedin.com/in/bhawesh01/)  
**Email:** bhaweshsingh1999@gmail.com  

> Passionate about building AI-powered and cloud-native applications that make a real-world impact. 💡