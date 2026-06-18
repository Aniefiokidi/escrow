import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions/new", label: "Create" },
  { to: "/profile", label: "Profile" },
  { to: "/disputes", label: "Disputes" },
  { to: "/admin", label: "Admin" }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">EscrowFlow</Link>

        <nav className="nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "active-link" : "")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="user-pill">
          <span>{user?.name}</span>
          <span className="trust">Trust {user?.trustScore ?? "-"}</span>

          <div className="notif-wrap">
            <button
              type="button"
              className="notif-bell-btn"
              onClick={() => setShowNotifs((v) => !v)}
              aria-label="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount}</span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-head">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-mark-all"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="notif-empty">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notif-item${n.read ? "" : " notif-item--unread"}`}
                      onClick={() => markRead(n._id)}
                    >
                      <p className="notif-msg">{n.message}</p>
                      <span className="notif-time">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button type="button" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
