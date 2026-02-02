/**
 * src/App.jsx
 *
 * Top-level app:
 * - manages theme (light/dark) and persists to localStorage
 * - provides a minimal auth helper via localStorage token
 * - sets up routing and protected routes
 */

import React, { useEffect, useState, createContext, useContext } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppShellLayout from "./components/AppShellLayout";
import ThemeToggle from "./components/ThemeToggle";

/* Placeholder pages — you'll replace with real imports later */
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ChatAI from "./pages/ChatAI";
import Profile from "./components/Profile";
import Register from "./components/Register";
import Login from "./components/Login";
import NotFound from "./pages/NotFound";

/* Simple Auth helpers using localStorage token (replace with real logic later) */
const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function getStoredAuth() {
  try {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

/* Protected route wrapper */
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    // redirect to /login and preserve attempted path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

export default function App() {
  // theme: "light" | "dark"
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  // simple auth state
  const [auth, setAuth] = useState(getStoredAuth);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // keep local storage auth in sync (e.g., after register/login)
  useEffect(() => {
    if (auth.token) {
      localStorage.setItem("token", auth.token);
    } else {
      localStorage.removeItem("token");
    }
    if (auth.user) {
      try {
        localStorage.setItem("user", JSON.stringify(auth.user));
      } catch {}
    } else {
      localStorage.removeItem("user");
    }
  }, [auth]);

  const authValue = {
    token: auth.token,
    user: auth.user,
    setAuth,
    signOut: () => setAuth({ token: null, user: null }),
  };

  return (
    <AuthContext.Provider value={authValue}>
      <AppShellLayout
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatAI />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={<Register onRegistered={(u, t) => setAuth({ user: u, token: t })} />}
          />
          <Route
            path="/login"
            element={<Login onLogin={(u, t) => setAuth({ user: u, token: t })} />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShellLayout>
    </AuthContext.Provider>
  );
}
