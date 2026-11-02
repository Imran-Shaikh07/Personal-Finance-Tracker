
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const nameRegex = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(value) {
  const name = value.trim();

  if (!name) return "Full name is required.";
  if (name.length < 2) return "Name must contain at least 2 characters.";
  if (name.length > 80) return "Name cannot exceed 80 characters.";
  if (!nameRegex.test(name)) {
    return "Use letters and spaces only. Apostrophes and hyphens are allowed.";
  }

  return "";
}

function validateEmail(value) {
  if (!value.trim()) return "Email address is required.";
  if (!emailRegex.test(value.trim())) {
    return "Please enter a valid email address.";
  }

  return "";
}

function validatePassword(value) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Use at least 8 characters.";
  if (value.length > 72) return "Password cannot exceed 72 characters.";
  if (!/[A-Z]/.test(value)) return "Add at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Add at least one lowercase letter.";
  if (!/[^A-Za-z0-9\s]/.test(value)) {
    return "Add at least one special character, such as @ or #.";
  }
  if (/\s/.test(value)) return "Password cannot contain spaces.";

  return "";
}

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
      {children}
    </p>
  );
}

function Brand() {
  return (
    <Link to="/login" className="inline-flex items-center gap-3">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <rect x="3" y="6" width="18" height="14" rx="3" />
          <path d="M3 10h18M16 15h2" strokeLinecap="round" />
          <path d="M6 6V4.5A1.5 1.5 0 0 1 7.5 3H18" />
        </svg>
      </span>

      <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
        Personal Finance Tracker
        <span className="text-emerald-600">.</span>
      </span>
    </Link>
  );
}

export default function AuthPage({ mode }) {
  const [activeMode, setActiveMode] = useState(
    mode === "register" ? "register" : "login"
  );

  const isRegister = activeMode === "register";
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode) {
    setActiveMode(nextMode);
    setName("");
    setEmail("");
    setPassword("");
    setErrors({});
    setError("");
    setShowPassword(false);

    // Keep the URL consistent with the selected form.
    navigate(nextMode === "register" ? "/register" : "/login", {
      replace: true,
    });
  }

  function updateField(field, value) {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    setErrors((previous) => ({
      ...previous,
      [field]:
        field === "name"
          ? validateName(value)
          : field === "email"
            ? validateEmail(value)
            : isRegister
              ? validatePassword(value)
              : value
                ? ""
                : "Password is required.",
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const nextErrors = {};

    if (isRegister) {
      const nameError = validateName(name);
      if (nameError) nextErrors.name = nameError;
    }

    const emailError = validateEmail(email);
    if (emailError) nextErrors.email = emailError;

    if (isRegister) {
      const passwordError = validatePassword(password);
      if (passwordError) nextErrors.password = passwordError;
    } else if (!password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(name.trim(), email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passwordRules = [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { label: "One lowercase letter", passed: /[a-z]/.test(password) },
    {
      label: "One special character",
      passed: /[^A-Za-z0-9\s]/.test(password),
    },
    {
      label: "No spaces",
      passed: password.length > 0 && !/\s/.test(password),
    },
  ];

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
      errors[field]
        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
        : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-100"
    }`;

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top-left logo */}
      <header className="flex min-h-[84px] items-center border-b border-slate-100 px-5 sm:px-8 lg:px-12">
        <Brand />
      </header>

      {/* Centered login and registration area */}
      <section className="flex min-h-[calc(100vh-84px)] items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              {isRegister ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="7" r="4" />
                  <path d="M19 8v6m-3-3h6" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="15" rx="3" />
                  <path d="M7 10h10M7 14h6" strokeLinecap="round" />
                </svg>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isRegister
                ? "Start managing your money with confidence."
                : "Sign in to manage your finances and track your progress."}
            </p>
          </div>

          {/* Login / Register tabs */}
          <div
            className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1.5"
            role="tablist"
            aria-label="Authentication options"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRegister}
              onClick={() => switchMode("login")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                !isRegister
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isRegister}
              onClick={() => switchMode("register")}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                isRegister
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Register
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_45px_-25px_rgba(15,23,42,0.22)] sm:p-8">
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {isRegister && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => updateField("name", e.target.value)}
                    onBlur={() =>
                      setErrors((prev) => ({
                        ...prev,
                        name: validateName(name),
                      }))
                    }
                    minLength={2}
                    maxLength={80}
                    aria-invalid={Boolean(errors.name)}
                    className={inputClass("name")}
                    required
                  />
                  <FieldError>{errors.name}</FieldError>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => updateField("email", e.target.value)}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      email: validateEmail(email),
                    }))
                  }
                  maxLength={254}
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass("email")}
                  required
                />
                <FieldError>{errors.email}</FieldError>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    placeholder={
                      isRegister
                        ? "Create a strong password"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => updateField("password", e.target.value)}
                    onBlur={() =>
                      setErrors((prev) => ({
                        ...prev,
                        password: isRegister
                          ? validatePassword(password)
                          : password
                            ? ""
                            : "Password is required.",
                      }))
                    }
                    minLength={isRegister ? 8 : undefined}
                    maxLength={72}
                    aria-invalid={Boolean(errors.password)}
                    className={`${inputClass("password")} pr-20`}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-3 my-auto rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {isRegister && (
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {passwordRules.map((rule) => (
                      <div
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs ${
                          rule.passed ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full ${
                            rule.passed ? "bg-emerald-100" : "bg-slate-100"
                          }`}
                        >
                          {rule.passed ? "✓" : "·"}
                        </span>
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}

                <FieldError>{errors.password}</FieldError>
              </div>

              {!isRegister && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Your financial information is protected.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create account"
                    : "Login"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to use your account responsibly.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Personal Finance Tracker
          </p>
        </div>
      </section>
    </main>
  );
}
