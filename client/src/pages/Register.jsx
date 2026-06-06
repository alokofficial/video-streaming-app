import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      setIsSubmitting(true);
      const { data } = await API.post("/auth/register", { name, email, password });
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch (error) {
      console.log(error);
      setErrorMessage(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Beautiful background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-slate-100 to-violet-100 dark:from-[#020c1b] dark:via-[#0d0f2b] dark:to-[#0b0a1e]" />

      {/* Animated floating orbs */}
      <div className="auth-orb auth-orb-1 top-[-10%] right-[-5%] h-[500px] w-[500px] bg-blue-400/30 dark:bg-blue-500/20 blur-[120px]" />
      <div className="auth-orb auth-orb-2 bottom-[-10%] left-[-5%] h-[450px] w-[450px] bg-violet-400/30 dark:bg-violet-600/20 blur-[120px]" />
      <div className="auth-orb auth-orb-3 top-[35%] right-[55%] h-[280px] w-[280px] bg-cyan-300/20 dark:bg-cyan-600/10 blur-[100px]" />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative w-full max-w-[420px] z-10 animate-slide-up">
        {/* Glass card */}
        <form
          onSubmit={handleRegister}
          className="w-full rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-white/5 p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
        >
          {/* Logo & brand */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex flex-col items-center gap-3 group">
              <div
                className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-2 border-white dark:border-white/20 bg-white dark:bg-black/30 p-1.5 shadow-xl transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                style={{ boxShadow: "0 0 0 4px rgba(59,130,246,0.15), 0 8px 24px rgba(0,0,0,0.12)" }}
              >
                <img
                  src="/logo.png"
                  alt="Flow Learn Logo"
                  className="h-full w-full object-cover rounded-xl"
                />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-blue-500 dark:text-blue-400">
                  New account
                </p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                  Join Flow Learn
                </h1>
              </div>
            </Link>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Create your account to access your video library
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Your details</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          </div>

          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3.5 text-sm text-rose-700 dark:text-rose-300 font-medium animate-notification">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMessage}
            </div>
          )}

          {/* Name field */}
          <div className="mb-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Full Name
            </label>
            <input
              type="text"
              required
              placeholder="Your full name"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none transition-all duration-200 input-glow text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email field */}
          <div className="mb-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none transition-all duration-200 input-glow text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="Create a strong password"
              className="w-full rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-3 text-sm outline-none transition-all duration-200 input-glow text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl btn-primary-blue p-3.5 text-sm font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
          >
            {isSubmitting ? "Creating account…" : "Create Account →"}
          </button>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline-offset-2 hover:underline transition-colors"
            >
              Login here
            </Link>
          </p>
        </form>

        {/* Card glow shadow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 to-violet-400/20 dark:from-blue-500/10 dark:to-violet-500/10 blur-2xl -z-10 scale-105 pointer-events-none" />
      </div>
    </div>
  );
}
