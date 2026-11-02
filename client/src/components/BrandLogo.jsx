
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function BrandLogo() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Link
      to="/dashboard"
      aria-label="Personal Finance Tracker home"
      className="inline-flex min-w-0 shrink-0 items-center gap-3"
    >
      {/* Wallet icon */}
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <rect x="3" y="6" width="18" height="14" rx="3" />
          <path d="M3 10h18" />
          <path d="M16 15h2" />
          <path d="M6 6V4.5A1.5 1.5 0 0 1 7.5 3H18" />
        </svg>
      </span>

      {/* Brand name: adapts to theme */}
      <span
        className={`whitespace-nowrap text-sm font-extrabold tracking-tight sm:text-base lg:text-lg ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        Personal Finance Tracker
        <span className="text-emerald-500">.</span>
      </span>
    </Link>
  );
}
