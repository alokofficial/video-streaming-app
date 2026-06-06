import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { useSiteGate } from "../context/SiteGateContext";

export default function SiteGate() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { unlock } = useSiteGate();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to where the visitor originally tried to go
  const from = location.state?.from?.pathname || "/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Please enter the access code.");
      return;
    }
    try {
      setIsSubmitting(true);
      await API.post("/auth/site-gate/verify", { password: code });
      unlock();
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Incorrect access code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-rose-50 to-purple-100 dark:from-[#080012] dark:via-[#12001f] dark:to-[#0a0a1a]" />

      {/* Animated floating orbs */}
      <div className="auth-orb auth-orb-1 top-[-15%] left-[-10%] h-[600px] w-[600px] bg-rose-400/20 dark:bg-rose-600/15 blur-[140px]" />
      <div className="auth-orb auth-orb-2 bottom-[-15%] right-[-10%] h-[550px] w-[550px] bg-violet-400/20 dark:bg-violet-600/15 blur-[140px]" />
      <div className="auth-orb auth-orb-3 top-[45%] left-[55%] h-[300px] w-[300px] bg-pink-300/15 dark:bg-purple-500/10 blur-[100px]" />

      {/* Lock icon at top-center */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center animate-slide-up">

        {/* Pulsing lock */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-rose-400/30 dark:bg-rose-500/20 blur-xl scale-150 pointer-events-none" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-rose-300/60 dark:border-rose-500/30 bg-white/80 dark:bg-black/30 shadow-2xl backdrop-blur-xl">
            <svg className="h-9 w-9 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-white/5 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-rose-500 dark:text-rose-400">
              Private Access
            </p>
            <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-800 dark:text-white">
              Enter Access Code
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This site is protected. Enter the access code to continue.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Verification</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3.5 text-sm text-rose-700 dark:text-rose-300 font-medium animate-notification">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Code input */}
          <div className="mb-6">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Access Code
            </label>
            <input
              type="password"
              required
              placeholder="Enter the secret access code"
              autoFocus
              className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none transition-all duration-200 input-glow text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm tracking-widest font-mono text-base"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl btn-animated-gradient p-3.5 text-sm font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:animation-none"
          >
            {isSubmitting ? "Verifying…" : "Unlock Access →"}
          </button>
        </form>

        {/* Card glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-400/15 to-violet-400/15 dark:from-rose-500/10 dark:to-violet-500/10 blur-2xl -z-10 scale-110 pointer-events-none" />
      </div>
    </div>
  );
}
