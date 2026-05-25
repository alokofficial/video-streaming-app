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
    <nav className="app-panel sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b p-3 backdrop-blur-md transition-all duration-300 sm:p-4">
      <Link to="/" className="flex items-center gap-3 min-w-0 flex-1 basis-40 group">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-black/5 dark:bg-black/20 p-0.5 shadow-sm transition-all duration-300 transform group-hover:scale-105 group-hover:border-red-500/30">
          <img
            src="/logo.png"
            alt="Flow Learn Logo"
            className="h-full w-full object-cover rounded-md"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-500 dark:text-red-400 sm:text-xs sm:tracking-[0.2em] transition-colors group-hover:text-red-400">
            Flow Learn
          </p>
          <h1 className="truncate text-sm font-bold sm:text-lg leading-tight">
            {headerTitle}
          </h1>
        </div>
      </Link>

      <div className="shrink-0">
        {!token ? (
          <div className="flex items-center gap-2 text-sm sm:gap-4 sm:text-base">
            <Link
              to="/login"
              className="app-surface app-hover rounded px-3 py-2 font-semibold"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="hidden rounded bg-red-600 px-3 py-2 font-semibold sm:inline-block"
            >
              Register
            </Link>
          </div>
        ) : (
          <div className="relative flex flex-wrap items-center justify-end gap-2 sm:gap-4">
            <div className="app-panel flex items-center gap-1 rounded-lg p-1">
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

            {showAdminViewSelector && (
              <div className="app-panel flex max-w-full items-center gap-2 rounded-lg border px-2 py-2">
                <span className="app-muted hidden text-xs font-semibold md:inline">
                  View as
                </span>

                <select
                  value={selectedAdminViewUserId}
                  onChange={(e) =>
                    onAdminViewUserChange(
                      e.target.value
                    )
                  }
                  className="app-input max-w-36 rounded border px-2 py-1 text-xs outline-none focus:border-red-500 sm:max-w-52"
                >
                  <option value="">
                    Admin view
                  </option>
                  {adminViewUsers.map((adminUser) => (
                    <option
                      key={adminUser.id}
                      value={adminUser.id}
                    >
                      {adminUser.name} (
                      {adminUser.email})
                    </option>
                  ))}
                </select>

                {Number.isFinite(adminViewCount) && (
                  <span className="rounded bg-red-600/20 px-2 py-1 text-xs font-semibold text-red-100">
                    {adminViewCount}
                  </span>
                )}
              </div>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-full border border-red-500/20 bg-linear-to-r from-red-500/10 to-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-500 shadow-sm transition-all duration-300 hover:from-red-500/20 hover:to-indigo-500/20 hover:border-red-500/40 dark:border-red-500/20 dark:text-red-400 dark:hover:border-red-500/50"
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
                <span>Admin</span>
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
              className="app-surface app-hover flex h-9 w-9 items-center justify-center rounded"
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
              className="app-hover flex flex-col items-center gap-1 rounded px-1 py-1 sm:px-2"
            >
              <span className="app-soft-surface flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10 overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
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

              <span className="app-muted max-w-[72px] truncate text-[11px] sm:max-w-[120px] sm:text-xs">
                {user?.name}
              </span>
            </button>

            {isMenuOpen && (
              <div className="app-panel light-shadow absolute right-0 top-14 z-20 w-[calc(100vw-1.5rem)] max-w-72 rounded-lg border p-4 shadow-xl sm:top-16">
                <div className="app-border mb-4 border-b pb-4">
                  <div className="flex items-center gap-3">
                    <span className="app-soft-surface flex h-11 w-11 items-center justify-center rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner">
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

                <div className="grid gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="app-hover rounded px-3 py-2"
                  >
                    User Profile
                  </Link>

                  <Link
                    to="/change-password"
                    onClick={() => setIsMenuOpen(false)}
                    className="app-hover rounded px-3 py-2"
                  >
                    Change Password
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="app-hover rounded px-3 py-2 text-left"
                  >
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
