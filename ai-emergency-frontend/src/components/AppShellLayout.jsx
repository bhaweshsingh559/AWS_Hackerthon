
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../App";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/chat", label: "Chat" },
  { to: "/profile", label: "Profile" },
];

export default function AppShellLayout({ children, theme, onToggleTheme }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, signOut } = useAuth();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className={`app-shell${isDashboard ? " app-shell--dashboard" : ""}`}>
      {/* ==== LEFT SIDEBAR ==== */}
      {!isDashboard && (
        <aside className="app-shell__sidebar" aria-hidden={false}>
          <div className="brand">
            <div className="brand__logo">🛡️</div>
            <div className="brand__title">Rakshak AI</div>
          </div>

          <nav className="nav">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "nav__link" +
                  (location.pathname === n.to ? " nav__link--active" : "")
                }
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="sidebar__footer">
            <ThemeToggle current={theme} onToggle={onToggleTheme} />

            {token && user ? (
              <button
                className="btn btn--ghost"
                onClick={() => {
                  signOut();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="btn btn--ghost">
                Login
              </Link>
            )}
          </div>
        </aside>
      )}

      {/* ==== MAIN AREA ==== */}
      <div className="app-shell__main">
        {!isDashboard && (
          <header className="topbar">
            <div className="topbar__left">
              <div className="topbar__title">Rakshak — Emergency Assistant</div>
              <div className="topbar__subtitle">
                Speak or type. SOS &amp; alerts with location.
              </div>
            </div>

            {/* ==== HEADER RIGHT SECTION ==== */}
            <div className="topbar__right" style={styles.topbarRight}>
              <ThemeToggle current={theme} onToggle={onToggleTheme} />

              {token && user ? (
                <>
                  <Link
                    to="/profile"
                    className="btn btn--ghost"
                    style={styles.profileBtn}
                  >
                    👤 {user.name || user.email?.split("@")[0] || "Profile"}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      navigate("/login");
                    }}
                    className="btn btn--danger"
                    style={styles.logoutBtn}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn--primary"
                    style={styles.loginBtn}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn--ghost"
                    style={styles.registerBtn}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </header>
        )}

        <main className={`content${isDashboard ? " content--dashboard" : ""}`}>{children}</main>

        {!isDashboard && (
          <footer className="footer">
            <div>© {new Date().getFullYear()} Rakshak AI</div>
            <div className="footer__right">Developed for Hackathon</div>
          </footer>
        )}
      </div>
    </div>
  );
}

const styles = {
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  profileBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "#0f172a",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "8px 12px",
    textDecoration: "none",
    fontSize: 14,
  },
  logoutBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  loginBtn: {
    background: "#007f5f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 12px",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 14,
  },
  registerBtn: {
    background: "transparent",
    border: "1px solid #007f5f",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#007f5f",
    fontWeight: 600,
    textDecoration: "none",
    fontSize: 14,
  },
};
