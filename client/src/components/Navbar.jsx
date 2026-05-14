import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { token, user, isAdmin, logout } = useAuth();

  return (
    <div className="bg-black text-white p-4 flex justify-between">
      <Link to="/">
        <h1 className="text-2xl font-bold">Learning App</h1>
      </Link>

      <div>
        {!token ? (
          <div className="flex gap-4">
            <Link to="/login">Login</Link>

            <Link to="/register">Register</Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin">Admin</Link>
            )}

            <span className="text-sm text-gray-300">
              {user?.name}
            </span>

            <button onClick={logout}>Logout</button>
          </div>
          // <button onClick={logout}>
          //   Logout
          // </button>
        )}
      </div>
    </div>
  );
}
