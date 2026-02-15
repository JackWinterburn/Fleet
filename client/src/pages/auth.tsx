import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useThemeMode } from "@/App";
import {
  Button,
  TextInput,
  InlineNotification,
  Loading,
} from "@carbon/react";
import {
  CircleFilled,
  Light,
  Asleep,
  ArrowRight,
  Login as LoginIcon,
} from "@carbon/icons-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return mode === "login" ? (
    <LoginForm onSwitch={() => setMode("register")} />
  ) : (
    <RegisterForm onSwitch={() => setMode("login")} />
  );
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { mode: themeMode, toggle } = useThemeMode();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav className="tc-landing-nav" style={{ backgroundColor: "var(--cds-layer, #f4f4f4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="tc-logo" style={{ backgroundColor: "#0f62fe", color: "#fff" }}>
            <CircleFilled size={16} />
          </div>
          <span style={{ fontWeight: 600 }} data-testid="text-app-name">TyreCommand</span>
        </div>
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          renderIcon={themeMode === "white" ? Asleep : Light}
          iconDescription="Toggle theme"
          onClick={toggle}
          data-testid="button-theme-toggle"
        />
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "24rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }} data-testid="text-auth-title">
            Sign in
          </h2>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "1.5rem" }}>
            Enter your credentials to access your fleet dashboard.
          </p>

          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onCloseButtonClick={() => setError("")}
              style={{ marginBottom: "1rem" }}
              data-testid="notification-error"
            />
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate();
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <TextInput
                id="login-username"
                labelText="Username"
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                data-testid="input-username"
                autoComplete="username"
              />
              <TextInput
                id="login-password"
                type="password"
                labelText="Password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                data-testid="input-password"
                autoComplete="current-password"
              />
              <Button
                kind="primary"
                type="submit"
                renderIcon={LoginIcon}
                disabled={loginMutation.isPending || !username || !password}
                style={{ width: "100%", maxWidth: "100%" }}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <p style={{ fontSize: "0.875rem", marginTop: "1.5rem", textAlign: "center" }}>
            Don't have an account?{" "}
            <button
              onClick={onSwitch}
              style={{
                background: "none",
                border: "none",
                color: "#0f62fe",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
              data-testid="button-switch-register"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { mode: themeMode, toggle } = useThemeMode();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          email: email || undefined,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav className="tc-landing-nav" style={{ backgroundColor: "var(--cds-layer, #f4f4f4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="tc-logo" style={{ backgroundColor: "#0f62fe", color: "#fff" }}>
            <CircleFilled size={16} />
          </div>
          <span style={{ fontWeight: 600 }} data-testid="text-app-name">TyreCommand</span>
        </div>
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          renderIcon={themeMode === "white" ? Asleep : Light}
          iconDescription="Toggle theme"
          onClick={toggle}
          data-testid="button-theme-toggle"
        />
      </nav>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "24rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }} data-testid="text-auth-title">
            Create account
          </h2>
          <p style={{ fontSize: "0.875rem", opacity: 0.7, marginBottom: "1.5rem" }}>
            Register to start managing your fleet tyres.
          </p>

          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              onCloseButtonClick={() => setError("")}
              style={{ marginBottom: "1rem" }}
              data-testid="notification-error"
            />
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate();
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <TextInput
                id="register-username"
                labelText="Username"
                value={username}
                onChange={(e: any) => setUsername(e.target.value)}
                data-testid="input-username"
                autoComplete="username"
              />
              <TextInput
                id="register-email"
                type="email"
                labelText="Email (optional)"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                data-testid="input-email"
                autoComplete="email"
              />
              <div style={{ display: "flex", gap: "1rem" }}>
                <TextInput
                  id="register-firstname"
                  labelText="First name"
                  value={firstName}
                  onChange={(e: any) => setFirstName(e.target.value)}
                  data-testid="input-firstname"
                />
                <TextInput
                  id="register-lastname"
                  labelText="Last name"
                  value={lastName}
                  onChange={(e: any) => setLastName(e.target.value)}
                  data-testid="input-lastname"
                />
              </div>
              <TextInput
                id="register-password"
                type="password"
                labelText="Password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                data-testid="input-password"
                autoComplete="new-password"
              />
              <TextInput
                id="register-confirm-password"
                type="password"
                labelText="Confirm password"
                value={confirmPassword}
                onChange={(e: any) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
                autoComplete="new-password"
              />
              <Button
                kind="primary"
                type="submit"
                renderIcon={ArrowRight}
                disabled={registerMutation.isPending || !username || !password || !confirmPassword}
                style={{ width: "100%", maxWidth: "100%" }}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>

          <p style={{ fontSize: "0.875rem", marginTop: "1.5rem", textAlign: "center" }}>
            Already have an account?{" "}
            <button
              onClick={onSwitch}
              style={{
                background: "none",
                border: "none",
                color: "#0f62fe",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
              data-testid="button-switch-login"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
