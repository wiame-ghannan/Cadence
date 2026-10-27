import { useState } from "react";
import { login, register } from "../api";
import Logo from "./Logo";
import ErrorMessage from "./ErrorMessage";

// Login and sign up page.
// onLogin is a function given by the parent: we call it with the token when it works.
export default function LoginForm({ onLogin }) {
  // "login" or "register": which form is shown
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  function switchMode(newMode) {
    setMode(newMode);
    setError("");
  }

  async function handleSubmit(event) {
    // Stop the browser from reloading the page when the form is sent
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      // A new account is created first, then we log in with it
      if (isRegister) {
        await register(name, email, password);
      }
      const token = await login(email, password);
      onLogin(token);
    } catch (err) {
      // err.message is already a readable sentence (see api.js)
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <Logo />

      <div className="auth-card">
        <h1 className="auth-title">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="auth-subtitle">
          {isRegister
            ? "Plan your projects and find their critical path."
            : "Log in to get back to your projects."}
        </p>

        <div className="auth-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegister}
            className={isRegister ? "auth-switch-button" : "auth-switch-button is-active"}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegister}
            className={isRegister ? "auth-switch-button is-active" : "auth-switch-button"}
            onClick={() => switchMode("register")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* The name is only asked when creating an account */}
          {isRegister && (
            <label className="field">
              <span className="field-label">Name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
            />
          </label>

          <ErrorMessage message={error} />

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}
