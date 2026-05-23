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
          className="rounded-xl app-panel p-6"
        >
          <h1 className="mb-6 text-3xl font-bold">
            Change Password
          </h1>

          {message && (
            <p className="mb-4 rounded bg-green-950 p-3 text-green-200">
              {message}
            </p>
          )}

          {error && (
            <p className="mb-4 rounded bg-red-950 p-3 text-red-200">
              {error}
            </p>
          )}

          <input
            type="password"
            placeholder="Current Password"
            className="mb-4 w-full rounded app-soft-surface p-3"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="New Password"
            className="mb-4 w-full rounded app-soft-surface p-3"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            className="mb-4 w-full rounded app-soft-surface p-3"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
          />

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded bg-red-600 p-3 font-semibold disabled:cursor-not-allowed disabled:bg-gray-700"
          >
            {isSaving
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
