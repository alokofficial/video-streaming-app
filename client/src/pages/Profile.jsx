import { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const avatarOptions = [
    { id: "1", path: "/avatars/avatar_1.png", label: "Executive Woman" },
    { id: "2", path: "/avatars/avatar_2.png", label: "Professional Man" },
    { id: "3", path: "/avatars/avatar_3.png", label: "Creative Woman" },
    { id: "4", path: "/avatars/avatar_4.png", label: "Tech Professional" },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const response = await API.put("/auth/profile", {
        name,
        avatar: selectedAvatar,
      });

      updateUser(response.data.user);
      setSuccessMsg("Profile updated successfully!");
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-page">
      <Navbar />

      <div className="mx-auto max-w-xl p-4 sm:p-6">
        <div className="rounded-xl app-panel p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/5 backdrop-blur-lg">
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <span className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-full app-soft-surface overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-xl">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt={name || user?.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-rose-500 to-indigo-600 font-bold text-white uppercase text-3xl shadow-inner">
                  {(name || user?.name || "U").charAt(0)}
                </div>
              )}
            </span>

            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                User Profile
              </h1>
              <p className="app-muted mt-1">
                Customize your account details and profile picture
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid gap-6">
            {successMsg && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-600 dark:text-emerald-300 font-medium animate-pulse">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-sm text-rose-600 dark:text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-sm font-semibold uppercase tracking-wider app-muted block mb-2">
                Display Name
              </label>
              <input
                type="text"
                required
                className="w-full rounded-lg app-soft-surface p-3 border border-slate-300 dark:border-white/10 focus:border-red-500 focus:outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="text-sm font-semibold uppercase tracking-wider app-muted block mb-2">
                Email Address
              </label>
              <input
                type="email"
                disabled
                className="w-full rounded-lg app-soft-surface p-3 border border-slate-200 dark:border-white/5 opacity-60 cursor-not-allowed"
                value={user?.email || ""}
              />
              <p className="text-[11px] text-gray-500 mt-1">Email cannot be modified.</p>
            </div>

            <div>
              <label className="text-sm font-semibold uppercase tracking-wider app-muted block mb-2">
                User Role
              </label>
              <div className="capitalize font-semibold text-lg app-soft-surface inline-block px-4 py-2 rounded-lg border border-slate-300 dark:border-white/10">
                {user?.role}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold uppercase tracking-wider app-muted block mb-3">
                Choose a Profile Avatar
              </label>
              
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {avatarOptions.map((opt) => {
                  const isSelected = selectedAvatar === opt.path;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedAvatar(opt.path)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                        isSelected
                          ? "border-red-500 scale-105 ring-4 ring-red-500/20"
                          : "border-transparent hover:border-red-500/50"
                      }`}
                      title={opt.label}
                    >
                      <img
                        src={opt.path}
                        alt={opt.label}
                        className="h-full w-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center">
                          <div className="bg-red-500 text-white rounded-full p-1 shadow-md">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedAvatar && (
                <button
                  type="button"
                  onClick={() => setSelectedAvatar("")}
                  className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors font-medium flex items-center gap-1"
                >
                  Clear Avatar & Use Initials
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl btn-primary-red py-3.5 font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
