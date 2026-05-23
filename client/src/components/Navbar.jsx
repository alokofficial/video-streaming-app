import {
  Link,
  useLocation,
} from "react-router-dom";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext";

export default function Navbar({
  adminViewUsers = [],
  selectedAdminViewUserId = "",
  onAdminViewUserChange,
  adminViewCount,
}) {
  const { token, user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const headerTitle = useMemo(() => {
    if (!token) {
      return "Learning App";
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

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  const showAdminViewSelector =
    isAdmin &&
    adminViewUsers.length > 0 &&
    onAdminViewUserChange;

  return (
    <nav className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-black/60 p-3 text-white backdrop-blur-md transition-all duration-300 sm:p-4">
      <Link to="/" className="min-w-0 flex-1 basis-40">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-red-400 sm:text-xs sm:tracking-[0.2em]">
          Learning App
        </p>
        <h1 className="truncate text-base font-bold sm:text-2xl">
          {headerTitle}
        </h1>
      </Link>

      <div className="shrink-0">
        {!token ? (
          <div className="flex items-center gap-2 text-sm sm:gap-4 sm:text-base">
            <Link
              to="/login"
              className="rounded bg-gray-900 px-3 py-2 font-semibold"
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
            {showAdminViewSelector && (
              <div className="flex max-w-full items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/80 px-2 py-2">
                <span className="hidden text-xs font-semibold text-gray-400 md:inline">
                  View as
                </span>

                <select
                  value={selectedAdminViewUserId}
                  onChange={(e) =>
                    onAdminViewUserChange(
                      e.target.value
                    )
                  }
                  className="max-w-36 rounded bg-gray-800 px-2 py-1 text-xs text-white outline-none focus:border-red-500 sm:max-w-52"
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
                className="rounded bg-gray-900 px-3 py-2 text-sm font-semibold hover:bg-gray-800 sm:text-base"
              >
                Admin
              </Link>
            )}

            <button
              type="button"
              onClick={() =>
                setIsMenuOpen((current) => !current)
              }
              className="flex flex-col items-center gap-1 rounded px-1 py-1 hover:bg-gray-900 sm:px-2"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 sm:h-10 sm:w-10">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="currentColor"
                >
                  <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.31 0-10 1.66-10 5v2h20v-2c0-3.34-6.69-5-10-5Z" />
                </svg>
              </span>

              <span className="max-w-[72px] truncate text-[11px] text-gray-300 sm:max-w-[120px] sm:text-xs">
                {user?.name}
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-14 z-20 w-[calc(100vw-1.5rem)] max-w-72 rounded-lg border border-gray-800 bg-gray-950 p-4 shadow-xl sm:top-16">
                <div className="mb-4 border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-800">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-7 w-7"
                        fill="currentColor"
                      >
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.31 0-10 1.66-10 5v2h20v-2c0-3.34-6.69-5-10-5Z" />
                      </svg>
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {user?.name}
                      </p>

                      <p className="truncate text-sm text-gray-400">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded px-3 py-2 hover:bg-gray-900"
                  >
                    User Profile
                  </Link>

                  <Link
                    to="/change-password"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded px-3 py-2 hover:bg-gray-900"
                  >
                    Change Password
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded px-3 py-2 text-left hover:bg-gray-900"
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
