import React, { useEffect } from "react";
import { motion } from "framer-motion";
import Logo from "../components/Logo";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;const FLOOR_CONFIG = {
  // 'A2': 14,
};
const DEFAULT_MAX_FLOOR = 14;

function generateTowers() {
  const arr = [];
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (const l of letters) {
    for (let i = 1; i <= 4; i++) {
      arr.push(`${l}${i}`);
    }
  }
  return arr;
}

const towers = generateTowers();

// Build Yup validation schema considering your custom flat validation
const schema = yup.object().shape({
  name: yup.string().required("Name is required").min(2, "Name must be at least 2 characters"),
  email: yup.string().required("Enter a valid email address").email(),
  phone: yup.string().required("Enter a valid 10-digit phone number").matches(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  password: yup.string().required("Password must be at least 8 characters").min(8),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], "Passwords do not match")
    .required("Confirm Password is required"),
  tower: yup.string().required("Tower is required"),
  flat: yup.string()
    .required("Flat must be 4 digits (floor + unit), e.g. 1205")
    .matches(/^\d{4}$/, "Flat must be 4 digits (e.g. 1205)")
    .test('flat-valid', 'Invalid flat number', function(value) {
      if (!value) return false;
      const floor = parseInt(value.slice(0, 2), 10);
      const unit = parseInt(value.slice(2), 10);
      const maxFloor = FLOOR_CONFIG[this.parent.tower] || DEFAULT_MAX_FLOOR;
      if (unit < 1 || unit > 12) return false;
      if (floor < 0 || floor > maxFloor) return false;
      return true;
    }),
});

export default function Register() {
  const navigate = useNavigate();

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
    defaultValues: {
      tower: "A1"
    }
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          tower: data.tower,
          flat: data.flat,
        }),
      });

      if (response.ok) {
        const res = await response.json();
        toast.success(res.message || "Registration successful!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Registration failed.");
      }
    } catch (error) {
      toast.error("Network error. Please try again later.");
      console.error("Registration API error:", error);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="min-h-screen w-full bg-gradient-to-br from-[#fff6e5] via-[#ffd6a5] to-[#ff8c42] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-md w-full bg-white bg-opacity-90 backdrop-blur-md rounded-3xl shadow-lg p-6 sm:p-10 border border-orange-200"
        >
          <div className="flex flex-col items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
            <Logo className="w-12 h-12 sm:w-16 sm:h-16" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E53935]">Create Account</h1>
            <p className="text-xs sm:text-sm text-gray-700 text-center">
              Register to start ordering Fresh & Clean Chicken
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          <div>
  <label htmlFor="name" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
    Name
  </label>
  <input
    id="name"
    {...register("name")}
    type="text"
    placeholder="Enter your name"
    className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
      errors.name ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-300"
    }`}
  />
  {errors.name && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.name.message}</p>}
</div>
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                Email Address
              </label>
              <input
                id="email"
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                  errors.email ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-300"
                }`}
              />
              {errors.email && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                {...register("phone")}
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                  errors.phone ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-300"
                }`}
              />
              {errors.phone && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                Password
              </label>
              <input
                id="password"
                {...register("password")}
                type="password"
                placeholder="Enter your password"
                className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                  errors.password ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-300"
                }`}
              />
              {errors.password && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                placeholder="Confirm your password"
                className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                  errors.confirmPassword ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-300"
                }`}
              />
              {errors.confirmPassword && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tower" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                  Tower
                </label>
                <select
                  id="tower"
                  {...register("tower")}
                  className="w-full rounded-xl border border-gray-300 px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 focus:outline-none focus:ring-4 focus:ring-orange-300"
                >
                  {towers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flat" className="block text-xs sm:text-sm font-semibold text-gray-800 mb-1">
                  Flat (4-digit e.g. 1205)
                </label>
                <input
                  id="flat"
                  {...register("flat")}
                  type="text"
                  placeholder="e.g. 1205"
                  className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                    errors.flat ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-orange-300"
                  }`}
                />
                {errors.flat && <p className="text-[10px] sm:text-xs text-red-500 mt-1">{errors.flat.message}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white text-lg font-semibold shadow-md hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-gray-600 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-orange-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>

          <p className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-gray-400">
            By registering you agree to our Terms & Privacy.
          </p>
        </motion.div>
      </div>
    </>
  );
}
