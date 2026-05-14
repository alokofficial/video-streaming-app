import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import API from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Register() {

  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {

    e.preventDefault();
    setErrorMessage("");

    try {
      setIsSubmitting(true);

      const { data } = await API.post("/auth/register", {
        name,
        email,
        password,
      });

      login(data.token, data.user);

      navigate("/");

    } catch (error) {

      console.log(error);

      setErrorMessage(
        error.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className="min-h-screen bg-black text-white">

      <div className="grid min-h-screen lg:grid-cols-[1fr_460px]">

        <div className="hidden bg-[radial-gradient(circle_at_20%_20%,#2563eb_0,#111827_34%,#000_72%)] p-10 lg:flex lg:flex-col lg:justify-between">
          <Link to="/">
            <h1 className="text-3xl font-bold">
              Learning App
            </h1>
          </Link>

          <div className="max-w-xl">
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-blue-300">
              Start learning
            </p>
            <h2 className="text-6xl font-bold leading-tight">
              Create your account and begin instantly.
            </h2>
            <p className="mt-6 text-lg text-gray-300">
              After registration, you will be taken
              directly to your video library.
            </p>
          </div>

          <p className="text-sm text-gray-400">
            Private video access, made simple
          </p>
        </div>

        <div className="flex items-center justify-center p-6">
          <form
            onSubmit={handleRegister}
            className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-8 shadow-2xl"
          >

            <div className="mb-8">
              <p className="text-sm font-semibold text-blue-400">
                New account
              </p>
              <h1 className="mt-2 text-4xl font-bold">
                Register
              </h1>
              <p className="mt-3 text-gray-400">
                Create your account to continue.
              </p>
            </div>

            {errorMessage && (
              <p className="mb-4 rounded bg-red-950 p-3 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            <label className="mb-2 block text-sm text-gray-300">
              Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              className="mb-5 w-full rounded-lg border border-gray-800 bg-gray-900 p-3 outline-none transition focus:border-blue-500"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <label className="mb-2 block text-sm text-gray-300">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              className="mb-5 w-full rounded-lg border border-gray-800 bg-gray-900 p-3 outline-none transition focus:border-blue-500"
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
              placeholder="Create password"
              className="mb-6 w-full rounded-lg border border-gray-800 bg-gray-900 p-3 outline-none transition focus:border-blue-500"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-blue-600 p-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              {isSubmitting
                ? "Creating account..."
                : "Create Account"}
            </button>

            <p className="mt-6 text-center text-gray-400">

              Already have an account?{" "}

              <Link
                to="/login"
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Login
              </Link>

            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
