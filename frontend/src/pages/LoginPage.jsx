import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ShieldCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand">
        <span className="auth-brand-icon"><ShieldCheckIcon /></span>
        <span className="auth-brand-text">
          <span className="brand-main">Escrow</span><span className="brand-accent">NG</span>
        </span>
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-sub">Sign in to your EscrowNG account to continue</p>

        {error && <div className="form-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary btn--full btn--lg">Sign In</button>
        </form>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}
