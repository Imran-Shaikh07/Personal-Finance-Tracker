
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api";
import { useTheme } from "../context/ThemeContext";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const SERVER_URL = API_BASE.replace(/\/api$/, "");

const CURRENCIES = [
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
];

function getPhotoUrl(photo) {
  if (!photo) return "";

  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    return photo;
  }

  return `${SERVER_URL}${photo.startsWith("/") ? "" : "/"}${photo}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  // Use the SAME theme selected on the Dashboard.
  // There is intentionally no theme toggle on this page.
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const pageClass = isDark
    ? "min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8"
    : "min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8";

  const cardClass = isDark
    ? "mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-8"
    : "mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8";

  const inputClass = isDark
    ? "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
    : "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  const labelClass = isDark
    ? "mb-2 block text-sm font-medium text-slate-300"
    : "mb-2 block text-sm font-medium text-slate-700";

  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  const dividerClass = isDark ? "border-slate-800" : "border-slate-200";

  const secondaryButtonClass = isDark
    ? "rounded-xl border border-slate-700 px-5 py-3 font-semibold transition hover:border-emerald-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    : "rounded-xl border border-slate-300 px-5 py-3 font-semibold transition hover:border-emerald-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60";

  const [form, setForm] = useState({
    name: user?.name || "",
    currency: user?.currency || "INR",
  });

  const [email, setEmail] = useState(user?.email || "");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    getPhotoUrl(user?.profilePhoto)
  );
  const [createdAt, setCreatedAt] = useState(user?.createdAt || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const data = await apiRequest("/profile");

        if (!active) return;

        const profile = data.user;

        setForm({
          name: profile.name || "",
          currency: profile.currency || "INR",
        });

        setEmail(profile.email || "");
        setPhotoPreview(getPhotoUrl(profile.profilePhoto));
        setCreatedAt(profile.createdAt || "");

        if (profile && updateUser) {
          updateUser(profile);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Could not load your profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your profile photo must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.name.trim().length < 2 || form.name.trim().length > 80) {
      setError("Your name must contain 2–80 characters.");
      return;
    }

    setSavingProfile(true);

    try {
      const body = new FormData();

      body.append("name", form.name.trim());
      body.append("currency", form.currency);

      if (photo) {
        body.append("photo", photo);
      }

      const data = await apiRequest("/profile", {
        method: "PUT",
        body,
      });

      const updatedUser = data.user;

      if (updatedUser) {
        updateUser(updatedUser);

        setForm({
          name: updatedUser.name || "",
          currency: updatedUser.currency || "INR",
        });

        setEmail(updatedUser.email || email);
        setCreatedAt(updatedUser.createdAt || createdAt);
        setPhotoPreview(getPhotoUrl(updatedUser.profilePhoto));
      }

      setPhoto(null);
      setSuccess(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("Your new password must contain 8–72 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const data = await apiRequest("/profile/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess(data.message || "Password changed. Please sign in again.");

      window.setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message || "Could not change your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className={pageClass}>
        <div className={`mx-auto max-w-4xl animate-pulse rounded-2xl border p-8 ${dividerClass} ${isDark ? "bg-slate-900" : "bg-white"}`}>
          Loading your profile...
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass}>
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className={`mb-6 text-sm transition ${
            isDark
              ? "text-slate-400 hover:text-white"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          ← Back to Dashboard
        </button>

        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
            Account settings
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Profile
          </h1>

          <p className={`mt-2 ${mutedClass}`}>
            Manage your personal information and account security.
          </p>

          <p className={`mt-2 text-xs ${mutedClass}`}>
            Theme is controlled from your Dashboard.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
              isDark
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {success}
          </div>
        )}

        <section className={cardClass}>
          <div className={`mb-7 flex flex-col gap-5 border-b pb-7 sm:flex-row sm:items-center ${dividerClass}`}>
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/60 text-3xl font-bold ${
                isDark
                  ? "bg-slate-800 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  onError={() => setPhotoPreview("")}
                  className="h-full w-full object-cover"
                />
              ) : (
                (form.name.trim().charAt(0) || "U").toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">
                {form.name || "Your name"}
              </h2>

              <p className={`mt-1 break-all text-sm ${mutedClass}`}>
                {email || "Your email address"}
              </p>

              <label
                className={`mt-4 inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  isDark
                    ? "border-slate-700 hover:border-emerald-400 hover:bg-slate-800"
                    : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
                }`}
              >
                Choose profile photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </label>

              <p className={`mt-2 text-xs ${mutedClass}`}>
                JPG, PNG, or WEBP. Maximum size: 5 MB.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <h3 className="text-lg font-semibold">Personal information</h3>

            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Full name
              </label>

              <input
                id="profile-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="profile-email" className={labelClass}>
                Email address
              </label>

              <input
                id="profile-email"
                type="email"
                value={email}
                readOnly
                className={`w-full cursor-not-allowed rounded-xl border px-4 py-3 ${
                  isDark
                    ? "border-slate-800 bg-slate-950/60 text-slate-500"
                    : "border-slate-200 bg-slate-100 text-slate-500"
                }`}
              />

              <p className={`mt-2 text-xs ${mutedClass}`}>
                Your email is read-only in this version.
              </p>
            </div>

            <div>
              <label htmlFor="profile-currency" className={labelClass}>
                Preferred currency
              </label>

              <select
                id="profile-currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className={inputClass}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>

              <p className={`mt-2 text-xs ${mutedClass}`}>
                This saves your preference. Transaction display formatting can
                be connected to it separately.
              </p>
            </div>

            {createdAt && (
              <p className={`text-sm ${mutedClass}`}>
                Member since{" "}
                {new Date(createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {savingProfile ? "Saving changes..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className={cardClass}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Change password</h2>
            <p className={`mt-2 text-sm ${mutedClass}`}>
              Choose a strong password you have not used elsewhere.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label htmlFor="current-password" className={labelClass}>
                Current password
              </label>

              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="new-password" className={labelClass}>
                New password
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                required
                className={inputClass}
              />

              <p className={`mt-2 text-xs ${mutedClass}`}>
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label htmlFor="confirm-password" className={labelClass}>
                Confirm new password
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className={secondaryButtonClass}
            >
              {savingPassword ? "Updating password..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
