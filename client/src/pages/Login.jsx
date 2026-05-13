import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import API from "../services/api";

import { useAuth } from "../context/AuthContext";

export default function Login() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const { login } = useAuth();

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const { data } = await API.post(
        "/auth/login",
        {
          email,
          password,
        }
      );

      login(data.token, data.user);

      alert("Login Successful");

      navigate("/");

    } catch (error) {

      console.log(error);

      alert("Invalid Credentials");
    }
  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-[400px]"
      >

        <h1 className="text-3xl font-bold mb-6 text-center">
          Login
        </h1>

        <input
          type="email"
          placeholder="Enter Email"
          className="w-full border p-3 mb-4 rounded"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Enter Password"
          className="w-full border p-3 mb-4 rounded"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          type="submit"
          className="w-full bg-black text-white p-3 rounded"
        >
          Login
        </button>

        <p className="mt-4 text-center">

          Don't have an account?{" "}

          <Link
            to="/register"
            className="text-blue-500"
          >
            Register
          </Link>

        </p>

      </form>

    </div>
  );
}
