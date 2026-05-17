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

export default function Navbar() {
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

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 text-white p-4 flex justify-between items-center gap-4 sticky top-0 z-50 transition-all duration-300">
      <Link to="/" className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
          Learning App
        </p>
        <h1 className="truncate text-2xl font-bold">
          {headerTitle}
        </h1>
      </Link>

      <div>
        {!token ? (
          <div className="flex gap-4">
            <Link to="/login">Login</Link>

            <Link to="/register">Register</Link>
          </div>
        ) : (
          <div className="relative flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="rounded bg-gray-900 px-3 py-2 font-semibold hover:bg-gray-800"
              >
                Admin
              </Link>
            )}

            <button
              type="button"
              onClick={() =>
                setIsMenuOpen((current) => !current)
              }
              className="flex flex-col items-center gap-1 rounded px-2 py-1 hover:bg-gray-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="currentColor"
                >
                  <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.31 0-10 1.66-10 5v2h20v-2c0-3.34-6.69-5-10-5Z" />
                </svg>
              </span>

              <span className="max-w-[120px] truncate text-xs text-gray-300">
                {user?.name}
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-16 z-20 w-72 rounded-lg border border-gray-800 bg-gray-950 p-4 shadow-xl">
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
