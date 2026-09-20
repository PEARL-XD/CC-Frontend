import React, { useCallback, useEffect, useContext, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
// The animation component is used in JSX; keep the explicit import for Vite's runtime transform.
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Logo from "../assets/images/logo.png";

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
  const { setAccessToken, setUser } = useContext(AuthContext);
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;

  const finishSocialLogin = useCallback(async (idToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/social-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: "google", idToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Google sign-in failed.");
      if (!result.accessToken) throw new Error("Google sign-in did not return a session token.");
      setAccessToken(result.accessToken);
      if (result.user) setUser(result.user);
      toast.success("Signed in with Google");
      navigate(location.state?.from || "/home", { replace: true });
    } catch (error) {
      toast.error(error.message || "Google sign-in failed.");
      console.error("Google sign-in error:", error);
    }
  }, [location.state, navigate, setAccessToken, setUser]);

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  useEffect(() => {
    if (!googleClientId) return undefined;
    const existing = document.querySelector("script[data-google-identity]");
    const script = existing || document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    if (!existing) document.head.appendChild(script);
    const ready = () => setGoogleReady(true);
    script.addEventListener("load", ready);
    if (window.google?.accounts?.id) ready();
    return () => script.removeEventListener("load", ready);
  }, [googleClientId]);

  useEffect(() => {
    if (!googleReady || !googleClientId || !googleButtonRef.current || !window.google?.accounts?.id) return;
    googleButtonRef.current.innerHTML = "";
    window.google.accounts.id.initialize({ client_id: googleClientId, callback: ({ credential }) => finishSocialLogin(credential) });
    const availableWidth = googleButtonRef.current.clientWidth || window.innerWidth - 32;
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: Math.min(360, Math.max(220, availableWidth)),
      text: "continue_with",
    });
  }, [finishSocialLogin, googleReady, googleClientId]);

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
      <div className="min-h-[100svh] w-full overflow-y-auto bg-gradient-to-br from-[#fff6e5] via-[#ffd6a5] to-[#ff8c42] px-3 py-6 sm:p-4">
        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-orange-200 bg-white bg-opacity-90 shadow-lg backdrop-blur-md lg:grid-cols-2">

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
            className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-10"
          >
            <div className="flex flex-col items-center gap-3 mb-8">
              <img src={Logo} alt="CleanChops Logo" className=" h-16 object-contain" />
              
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

              <div className="flex justify-end">
                <Link
                  to="/support"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#E53935] hover:underline"
                >
                  Need help? Contact support
                </Link>
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
              New to CleanChops?{" "}
              <Link
                to="/register"
                className="text-orange-600 font-medium hover:underline"
              >
                Create an account
              </Link>
            </p>

            {googleClientId && <div className="mt-5 flex w-full max-w-[360px] justify-center self-center overflow-hidden" ref={googleButtonRef} aria-label="Continue with Google" />}

            <p className="mt-8 text-center text-xs text-gray-400">
  By signing in you agree to our{" "}
  <Link to="/info" className="underline hover:text-gray-600">
    Terms & Privacy
  </Link>.
</p>
          </motion.div>

        </div>
      </div>
    </>
  );
}
