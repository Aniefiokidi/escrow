import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode = "login" }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer"
  });
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.email, form.password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
        <p>{isRegister ? "Secure deals with milestone escrow." : "Sign in to manage your escrow transactions."}</p>

        <form onSubmit={onSubmit} className="form-grid">
          {isRegister && (
            <>
              <label>
                Full Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Role
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="primary-btn">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
