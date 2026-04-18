import React, { useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Validation schema with Yup
const schema = yup.object().shape({
  phone: yup
    .string()
    .required("Enter your phone number")
    .matches(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  password: yup
    .string()
    .required("Enter your password")
    .min(8, "Password must be at least 8 characters"),
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ added
  const { setAccessToken } = useContext(AuthContext);

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setAccessToken(result.accessToken);
        toast.success(result.message || "Login successful!");

        // ✅ redirect back logic
        const from = location.state?.from || "/home";
        navigate(from, { replace: true });

      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Login failed. Please check credentials.");
      }
    } catch (error) {
      toast.error("Network error. Please try again later.");
      console.error("Login API error:", error);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="h-screen w-full bg-gradient-to-br from-[#fff6e5] via-[#ffd6a5] to-[#ff8c42] overflow-hidden flex items-center justify-center p-4">
        <div className="max-w-6xl w-full bg-white bg-opacity-90 backdrop-blur-md rounded-3xl shadow-lg border border-orange-200 grid lg:grid-cols-2">

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="hidden lg:flex flex-col justify-center p-12 space-y-8 border-r border-orange-200"
          >
            <h2 className="text-4xl font-extrabold text-[#E53935]">
              Fresh. Clean. Delivered.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center p-10"
          >
            <div className="flex flex-col items-center gap-3 mb-8">
              <Logo className="w-16 h-16" />
              <h1 className="text-3xl font-extrabold text-[#E53935]">
                CleanCuts
              </h1>
              <p className="text-sm text-gray-700">
                Sign in to place your order
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 max-w-md mx-auto w-full"
            >
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-gray-800 mb-1"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  {...register("phone")}
                  type="tel"
                  inputMode="numeric"
                  placeholder="9876543210"
                  className={`w-full rounded-xl border px-4 py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                    errors.phone
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-orange-300"
                  }`}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-800 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  {...register("password")}
                  type="password"
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border px-4 py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-300"
                      : "border-gray-300 focus:ring-orange-300"
                  }`}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white text-lg font-semibold shadow-md hover:scale-105 transition-transform disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              New to CleanCuts?{" "}
              <Link
                to="/register"
                className="text-orange-600 font-medium hover:underline"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-8 text-center text-xs text-gray-400">
              By signing in you agree to our Terms & Privacy.
            </p>
          </motion.div>

        </div>
      </div>
    </>
  );
}