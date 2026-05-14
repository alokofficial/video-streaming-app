import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import API from "../services/api";

import { useAuth } from "../context/AuthContext";

export default function Login() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = async (e) => {

    e.preventDefault();
    setErrorMessage("");

    try {
      setIsSubmitting(true);

      const { data } = await API.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      login(data.token, data.user);

      navigate("/");

    } catch (error) {

      console.log(error);

      setErrorMessage(
        error.response?.data?.message ||
          "Invalid credentials"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className="min-h-screen bg-black text-white">

      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">

        <div className="hidden bg-[radial-gradient(circle_at_20%_20%,#dc2626_0,#111827_32%,#000_70%)] p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/">
            <h1 className="text-3xl font-bold">
              Learning App
            </h1>
          </Link>

          <div className="max-w-xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-red-300">
              Stream with access control
            </p>
            <h2 className="text-6xl font-bold leading-tight">
              Continue watching your private video library.
            </h2>
            <p className="mt-6 text-lg text-gray-300">
              Sign in to view the videos assigned to your
              account.
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Secure role-based video access
          </p>
        </div>

        <div className="flex items-center justify-center p-6">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-8 shadow-2xl"
          >

            <div className="mb-8">
              <p className="text-sm font-semibold text-red-400">
                Welcome back
              </p>
              <h1 className="mt-2 text-4xl font-bold">
                Login
              </h1>
              <p className="mt-3 text-gray-400">
                Enter your details to continue.
              </p>
            </div>

            {errorMessage && (
              <p className="mb-4 rounded bg-red-950 p-3 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            <label className="mb-2 block text-sm text-gray-300">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="mb-5 w-full rounded-lg border border-gray-800 bg-gray-900 p-3 outline-none transition focus:border-red-500"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <label className="mb-2 block text-sm text-gray-300">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="mb-6 w-full rounded-lg border border-gray-800 bg-gray-900 p-3 outline-none transition focus:border-red-500"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-red-600 p-3 font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              {isSubmitting
                ? "Signing in..."
                : "Login"}
            </button>

            <p className="mt-6 text-center text-gray-400">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-red-400 hover:text-red-300"
              >
                Register
              </Link>

            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
