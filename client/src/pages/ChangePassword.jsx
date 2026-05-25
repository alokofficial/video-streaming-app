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

      <div className="mx-auto max-w-xl p-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 dark:border-white/5 app-panel p-6 shadow-2xl backdrop-blur-lg bg-white/80 dark:bg-black/30"
        >
          <h1 className="mb-6 text-3xl font-extrabold tracking-tight">
            Change Password
          </h1>

          {message && (
            <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-600 dark:text-emerald-300 font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-600 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter current password"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider app-muted">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 app-soft-surface p-3 outline-none transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl btn-primary-red p-3.5 font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
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
