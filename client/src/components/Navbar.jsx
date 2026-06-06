import {
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const APP_HISTORY_KEY = "appNavigationHistory";
const APP_HISTORY_INDEX_KEY =
  "appNavigationHistoryIndex";

export default function Navbar({
  adminViewUsers = [],
  selectedAdminViewUserId = "",
  onAdminViewUserChange,
  adminViewCount,
}) {
  const { token, user, isAdmin, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const previousPathRef = useRef("");
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);
  const [canGoBack, setCanGoBack] =
    useState(false);
  const [canGoForward, setCanGoForward] =
    useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll-aware navbar glow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerTitle = useMemo(() => {
    if (!token) {
      return "Flow Learn";
    }

    if (location.pathname === "/admin") {
      return "Admin Dashboard";
    }

    if (location.pathname === "/profile") {
      return "User Profile";
    }

    if (location.pathname === "/change-password") {
      return "Account Security";
    }

    if (location.pathname.startsWith("/watch")) {
      return "Now Watching";
    }

    return isAdmin
      ? `Welcome, ${user?.name || "Admin"}`
      : `My Library`;
  }, [isAdmin, location.pathname, token, user?.name]);

  useEffect(() => {
    document.title = headerTitle;
  }, [headerTitle]);

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;

    if (previousPathRef.current === currentPath) {
      return;
    }

    previousPathRef.current = currentPath;

    let stack;
    let index;

    try {
      stack = JSON.parse(
        sessionStorage.getItem(APP_HISTORY_KEY) ||
          "[]"
      );
      index = Number(
        sessionStorage.getItem(
          APP_HISTORY_INDEX_KEY
        )
      );
    } catch {
      stack = [];
      index = -1;
    }

    if (!Number.isFinite(index)) {
      index = -1;
    }

    if (
      navigationType === "REPLACE" ||
      stack.length === 0 ||
      index < 0
    ) {
      stack = [currentPath];
      index = 0;
    } else if (stack[index] === currentPath) {
      // Already positioned on this entry.
    } else if (navigationType === "POP") {
      if (stack[index - 1] === currentPath) {
        index -= 1;
      } else if (stack[index + 1] === currentPath) {
        index += 1;
      } else {
        stack = [
          ...stack.slice(0, index + 1),
          currentPath,
        ];
        index = stack.length - 1;
      }
    } else {
      stack = [
        ...stack.slice(0, index + 1),
        currentPath,
      ];
      index = stack.length - 1;
    }

    sessionStorage.setItem(
      APP_HISTORY_KEY,
      JSON.stringify(stack)
    );
    sessionStorage.setItem(
      APP_HISTORY_INDEX_KEY,
      String(index)
    );

    setCanGoBack(index > 0);
    setCanGoForward(index < stack.length - 1);
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigationType,
  ]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    sessionStorage.removeItem(APP_HISTORY_KEY);
    sessionStorage.removeItem(APP_HISTORY_INDEX_KEY);
    logout();
  };

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      navigate(1);
    }
  };

  const showAdminViewSelector =
    isAdmin &&
    adminViewUsers.length > 0 &&
    onAdminViewUserChange;

  return (
    <nav className={`app-panel sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 p-3 backdrop-blur-xl transition-all duration-500 sm:p-4 ${isScrolled ? 'navbar-scrolled' : 'navbar-gradient-border'}`}>
      <Link to="/" className="flex items-center gap-3 min-w-0 flex-1 md:basis-40 group">
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 p-0.5 shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:border-red-500/40 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <img
              src="/logo.png"
              alt="Flow Learn Logo"
              className="h-full w-full object-cover rounded-lg"
            />
          </div>
          <span className="clock-pill hidden sm:inline-block text-[11px] font-mono font-semibold tracking-tight text-black dark:text-white/80">
            {currentTime}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-red-500 dark:text-red-400 sm:text-xs sm:tracking-[0.22em] transition-colors group-hover:text-red-400">
            Flow Learn
          </p>
          <h1 className="truncate text-sm font-bold sm:text-lg leading-tight">
            {headerTitle}
          </h1>
        </div>
      </Link>

      {token && showAdminViewSelector && (
        <div className="w-full md:w-auto order-3 md:order-none flex justify-center md:justify-start">
          <div className="app-panel glass-card flex w-full md:w-auto items-center justify-between md:justify-start gap-2 rounded-xl border px-3 py-1.5 shadow-sm">
            <span className="app-muted text-xs font-semibold hidden lg:inline">
              View as
            </span>
            <select
              value={selectedAdminViewUserId}
              onChange={(e) => onAdminViewUserChange(e.target.value)}
              className="app-input flex-1 md:flex-initial md:w-48 rounded-lg border px-2 py-1 text-xs outline-none focus:border-red-500"
            >
              <option value="">Admin view</option>
              {adminViewUsers.map((adminUser) => (
                <option key={adminUser.id} value={adminUser.id}>
                  {adminUser.name} ({adminUser.email})
                </option>
              ))}
            </select>
            {Number.isFinite(adminViewCount) && (
              <span className="rounded-md bg-red-600/20 px-2 py-1 text-xs font-semibold text-red-100 border border-red-500/20 shrink-0">
                {adminViewCount}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="shrink-0 order-2 md:order-none">
        {!token ? (
          <div className="flex items-center gap-2 text-sm sm:gap-4 sm:text-base">
            <Link
              to="/login"
              className="app-surface app-hover rounded-lg px-4 py-2 font-semibold transition-all duration-200 hover:shadow-md"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="hidden rounded-lg bg-red-600 px-4 py-2 font-semibold sm:inline-block transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/20"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="relative flex items-center justify-end gap-1.5 sm:gap-2.5">
            <div className="app-panel glass-card hidden sm:flex items-center gap-1 rounded-xl p-1 shrink-0">
              <button
                type="button"
                aria-label="Go back"
                title="Back"
                disabled={!canGoBack}
                onClick={handleBack}
                className="btn-nav-control flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="m12 19-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                aria-label="Go forward"
                title="Forward"
                disabled={!canGoForward}
                onClick={handleForward}
                className="btn-nav-control flex h-9 w-9 items-center justify-center rounded-lg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-linear-to-r from-red-500/10 to-indigo-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-500 shadow-sm transition-all duration-300 hover:from-red-500/20 hover:to-indigo-500/20 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:border-red-500/20 dark:text-red-400 dark:hover:border-red-500/50 sm:px-3.5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-3.5 w-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            <button
              type="button"
              aria-label="Toggle theme"
              title={
                isDarkMode
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              onClick={toggleTheme}
              className="app-surface flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300 hover:bg-[var(--app-hover)] hover:shadow-md hover:scale-105 shrink-0"
            >
              {isDarkMode ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setIsMenuOpen((current) => !current)
              }
              className="flex items-center gap-2 rounded-lg p-1 sm:p-2 transition-all duration-200 hover:bg-[var(--app-hover)] shrink-0"
            >
              <span className="avatar-ring flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-rose-500 to-indigo-600 font-bold text-white uppercase text-xs">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </span>

              <span className="app-muted hidden md:inline-block max-w-[100px] truncate text-xs">
                {user?.name}
              </span>
            </button>

            {isMenuOpen && (
              <div className="app-panel light-shadow absolute right-0 top-14 z-20 w-[calc(100vw-1.5rem)] max-w-72 rounded-xl border p-4 shadow-2xl sm:top-16 glass-card animate-slide-down-menu">
                <div className="app-border mb-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 shadow-lg">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-rose-500 to-indigo-600 font-bold text-white uppercase text-sm">
                          {user?.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {user?.name}
                      </p>

                      <p className="app-muted truncate text-sm">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-[var(--app-hover)] hover:translate-x-1 flex items-center gap-2.5"
                  >
                    <svg className="h-4 w-4 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Profile
                  </Link>

                  <Link
                    to="/notes"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-[var(--app-hover)] hover:translate-x-1 flex items-center gap-2.5"
                  >
                    <svg className="h-4 w-4 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    My Notes
                  </Link>

                  <Link
                    to="/change-password"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-[var(--app-hover)] hover:translate-x-1 flex items-center gap-2.5"
                  >
                    <svg className="h-4 w-4 app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password
                  </Link>

                  <div className="my-1 h-px bg-[var(--app-border)]" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-400 flex items-center gap-2.5"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
