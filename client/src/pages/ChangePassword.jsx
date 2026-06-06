import { useState } from "react";

import Navbar from "../components/Navbar";
import API from "../services/api";

const getErrorMessage = (error) => {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong"
  );
};

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const passwordStrength = (() => {
    if (!newPassword) return { level: 0, label: "", color: "" };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-orange-500" };
    if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { level: 4, label: "Strong", color: "bg-emerald-500" };
    return { level: 5, label: "Excellent", color: "bg-emerald-400" };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      setIsSaving(true);

      const { data } = await API.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        }
      );

      setMessage(data.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-page">
      <Navbar />

      <div className="mx-auto max-w-xl p-4 sm:p-6 animate-slide-up">
        <form
          onSubmit={handleSubmit}
          className="gradient-top-border rounded-2xl border border-slate-200 dark:border-white/5 app-panel p-5 sm:p-7 shadow-2xl backdrop-blur-lg"
        >
          {/* Header with shield */}
          <div className="flex items-center gap-4 mb-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl glass-card border border-[var(--app-accent)]/20 shrink-0">
              <svg className="h-6 w-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Change Password
              </h1>
              <p className="app-muted text-sm mt-0.5">Keep your account secure</p>
            </div>
          </div>

          {message && (
            <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-sm text-emerald-600 dark:text-emerald-300 font-medium animate-notification flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-600 dark:text-rose-300 font-medium animate-notification flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider app-muted">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 input-glow"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
            />
          </div>

          <div className="mb-2">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider app-muted">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 input-glow"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
            />
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="mb-5 animate-fade-in">
              <div className="flex gap-1 mb-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                      i <= passwordStrength.level
                        ? passwordStrength.color
                        : "bg-slate-700/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-medium app-muted">
                Strength: <span className={`${passwordStrength.level >= 4 ? 'text-emerald-400' : passwordStrength.level >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>{passwordStrength.label}</span>
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider app-muted">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 input-glow"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="mt-1.5 text-[11px] text-red-400 font-medium animate-fade-in">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl btn-animated-gradient p-3.5 font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:animation-none"
          >
            {isSaving
              ? "Saving New Password..."
              : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
