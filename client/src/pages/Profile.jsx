import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto max-w-xl p-6">
        <div className="rounded-xl bg-gray-900 p-6">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-800">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-10 w-10"
                fill="currentColor"
              >
                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-3.31 0-10 1.66-10 5v2h20v-2c0-3.34-6.69-5-10-5Z" />
              </svg>
            </span>

            <div>
              <h1 className="text-3xl font-bold">
                User Profile
              </h1>
              <p className="text-gray-400">
                Your account details
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <p className="text-sm text-gray-400">
                Name
              </p>
              <p className="text-lg font-semibold">
                {user?.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">
                Email
              </p>
              <p className="break-all text-lg font-semibold">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">
                Role
              </p>
              <p className="text-lg font-semibold capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
