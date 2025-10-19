// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

function readStored() {
  try {
    const token = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    const user = u ? JSON.parse(u) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const initial = readStored();
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  function setAuth({ token: t, user: u }) {
    setToken(t ?? null);
    setUser(u ?? null);
  }

  function signOut() {
    setToken(null);
    setUser(null);
  }

  const value = {
    token,
    user,
    setToken,
    setUser,
    setAuth,
    signOut,
    isAuthenticated: Boolean(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}