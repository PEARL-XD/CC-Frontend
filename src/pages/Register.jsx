import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Logo from "../assets/images/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const SOCIETY_OPTIONS = {
  "Indraprastha, Ghaziabad": [
    "Bharat City",
    "Delhi-99",
    "G.D.A Society, Pocket-D",
  ],
  "Gagan Vihar, Sahibabad, Ghaziabad": [
    "Oxy Homez",
    "K10 Koyal Enclave",
    "Planet One",
  ],
};

const schema = yup.object().shape({
  name: yup
    .string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: yup
    .string()
    .required("Enter a valid email address")
    .email("Enter a valid email address"),
  phone: yup
    .string()
    .required("Enter a valid 10-digit phone number")
    .matches(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  password: yup
    .string()
    .required("Password must be at least 8 characters")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords do not match")
    .required("Confirm Password is required"),
  society: yup.string().required("Please select your society"),
  tower: yup.string().required("Tower is required"),
  floor: yup.string().optional(),
  flat: yup.string().required("Flat number is required"),
});

const allSocieties = Object.entries(SOCIETY_OPTIONS).flatMap(
  ([locality, societies]) =>
    societies.map((society) => ({
      locality,
      society,
    })),
);

export default function Register() {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onBlur",
    defaultValues: {
      society: "",
      tower: "",
      floor: "",
      flat: "",
    },
  });

  const selectedSociety = watch("society");

  const selectedSocietyMeta = useMemo(
    () => allSocieties.find((item) => item.society === selectedSociety),
    [selectedSociety],
  );

  const filteredSocieties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSocieties;
    return allSocieties.filter(
      (item) =>
        item.society.toLowerCase().includes(q) ||
        item.locality.toLowerCase().includes(q),
    );
  }, [search]);

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
          society: data.society,
          tower: data.tower,
          floor: data.floor,
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

  const handleSocietySelect = async (society) => {
    setValue("society", society, { shouldValidate: true, shouldDirty: true });
    setPickerOpen(false);
    setSearch("");
    await trigger("society");
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="min-h-screen w-full bg-[linear-gradient(135deg,#fff7ed_0%,#ffd9b3_45%,#ff9d62_100%)] px-4 py-4 sm:px-6 sm:py-6">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]"
        >
          <aside className="hidden flex-col justify-center bg-[linear-gradient(180deg,#fff8f1_0%,#ffe3c8_100%)] p-10 lg:flex">
            <div className="max-w-md">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[#E53935]">
                Join CleanChops
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[0.96] tracking-tight text-[#161616]">
                Create your account and order with ease.
              </h2>
              <p className="mt-4 text-base leading-8 text-black/65">
                Keep your address, order history, and delivery updates ready in
                one clean place.
              </p>
            </div>
          </aside>

          <section className="p-5 sm:p-7 lg:p-10">
            <div className="mx-auto flex max-w-xl flex-col">
              <div className="mb-7 flex flex-col items-center gap-3 text-center sm:mb-8">
                <img
                  src={Logo}
                  alt="CleanChops Logo"
                  className="h-14 object-contain sm:h-16"
                />
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#E53935] sm:text-3xl">
                    Create Account
                  </h1>
                  <p className="mt-1 text-sm text-gray-700 sm:text-base">
                    Register to start ordering fresh and clean chicken.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-semibold text-gray-800"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    {...register("name")}
                    type="text"
                    placeholder="Enter your name"
                    className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                      errors.name
                        ? "border-red-400 focus:ring-red-300"
                        : "border-gray-300 focus:ring-orange-300"
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      {...register("email")}
                      type="email"
                      placeholder="Enter your email"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                        errors.email
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      {...register("phone")}
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                        errors.phone
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      {...register("password")}
                      type="password"
                      placeholder="Enter your password"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                        errors.password
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      {...register("confirmPassword")}
                      type="password"
                      placeholder="Confirm your password"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                        errors.confirmPassword
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800">
                    Select Your Society
                  </label>

                  <input type="hidden" {...register("society")} />

                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className={`w-full rounded-2xl border px-4 py-3.5 text-left transition focus:outline-none focus:ring-4 ${
                      errors.society
                        ? "border-red-400 focus:ring-red-300"
                        : "border-gray-300 focus:ring-orange-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-sm sm:text-base ${
                            selectedSociety ? "text-gray-800" : "text-gray-400"
                          }`}
                        >
                          {selectedSociety || "Choose your society"}
                        </p>
                        {selectedSocietyMeta && (
                          <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs">
                            {selectedSocietyMeta.locality}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">▼</span>
                    </div>
                  </button>

                  {errors.society && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.society.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="tower"
                    className="mb-1 block text-sm font-semibold text-gray-800"
                  >
                    Tower
                  </label>
                  <input
                    id="tower"
                    {...register("tower")}
                    type="text"
                    placeholder="A1 / A block"
                    className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                      errors.tower
                        ? "border-red-400 focus:ring-red-300"
                        : "border-gray-300 focus:ring-orange-300"
                    }`}
                  />
                  {errors.tower && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.tower.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="floor"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      Floor No.
                    </label>
                    <input
                      id="floor"
                      {...register("floor")}
                      type="text"
                      placeholder="e.g. 5"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                        errors.floor
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                    />
                    {errors.floor && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.floor.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="flat"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      Flat No
                    </label>
                    <input
                      id="flat"
                      {...register("flat")}
                      type="text"
                      placeholder="Your flat number"
                      className={`w-full rounded-2xl border px-4 py-3.5 text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-4 ${
                        errors.flat
                          ? "border-red-400 focus:ring-red-300"
                          : "border-gray-300 focus:ring-orange-300"
                      }`}
                    />
                    {errors.flat && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.flat.message}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] py-3.5 text-lg font-semibold text-white shadow-md transition-transform hover:scale-[1.01] disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-orange-600 hover:underline"
                >
                  Sign In
                </Link>
              </p>

              <p className="mt-5 text-center text-xs text-gray-400">
                By signing in you agree to our{" "}
                <Link to="/info" className="underline hover:text-gray-600">
                  Terms & Privacy
                </Link>
                .
              </p>
            </div>
          </section>
        </motion.div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-orange-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Select your society
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Search by society or locality
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  setSearch("");
                }}
                className="text-xl leading-none text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search society..."
                className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-300"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto px-4 pb-4">
              {filteredSocieties.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No society found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSocieties.map((item) => (
                    <button
                      key={`${item.locality}-${item.society}`}
                      type="button"
                      onClick={() => handleSocietySelect(item.society)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedSociety === item.society
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/40"
                      }`}
                    >
                      <div className="font-semibold text-gray-900">
                        {item.society}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {item.locality}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
