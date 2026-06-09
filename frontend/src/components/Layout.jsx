import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/transactions/new", label: "Create" },
  { to: "/profile", label: "Profile" },
  { to: "/disputes", label: "Disputes" },
  { to: "/admin", label: "Admin" }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="brand">
          EscrowFlow
        </Link>
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
          <button type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="page-content">{children}</main>
    </div>
  );
}
