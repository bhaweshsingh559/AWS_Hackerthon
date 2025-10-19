# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


folder structure
ai-emergency-frontend/
├─ public/
│   └─ index.html
├─ src/
│   ├─ api/
│   │   └─ http.js
│   ├─ assets/
│   │   └─ logo.svg
│   ├─ components/
│   │   ├─ AppShellLayout.jsx
│   │   ├─ ThemeToggle.jsx
│   │   ├─ HeaderBar.jsx
│   │   ├─ Register.jsx
│   │   ├─ Login.jsx
│   │   ├─ Profile.jsx
│   │   ├─ ChatWindow.jsx
│   │   ├─ SOSPage.jsx
│   │   ├─ InstructionCard.jsx
│   │   └─ MicButton.jsx
│   ├─ hooks/
│   │   └─ useMySpeech.js
│   ├─ pages/
│   │   ├─ Home.jsx
│   │   ├─ Chat.jsx    (wraps ChatWindow)
│   │   └─ NotFound.jsx
│   ├─ styles/
│   │   └─ global.css
│   ├─ utils/
│   │   ├─ auth.js
│   │   ├─ helpers.js
│   │   └─ logger.js
│   ├─ App.jsx
│   ├─ main.jsx
│   └─ vite-env.d.ts (optional)
├─ .env                (development vars - NOT committed)
├─ .env.production     (production vars)
├─ postcss.config.cjs
├─ package.json
├─ vite.config.js
└─ Dockerfile 


cmd
# install deps
npm ci

# dev server
npm run dev

# preview production locally (after build)
npm run build
npm run preview

Docker (production)
# build docker image (from repo root)
docker build -t ai-emergency-frontend:latest .

# run
docker run -p 8080:80 --rm ai-emergency-frontend:latest
# open http://localhost:8080

