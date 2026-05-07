import React, { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FLOOR_CONFIG = {
  // A2: 14,
};

const DEFAULT_MAX_FLOOR = 14;

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

const ALL_SOCIETIES = Object.entries(SOCIETY_OPTIONS).flatMap(
  ([locality, societies]) =>
    societies.map((society) => ({
      locality,
      society,
    }))
);

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

export default function EditProfile() {
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    society: "",
    tower: "A1",
    flat: "",
  });

  const [initialForm, setInitialForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!accessToken) return;

    const seededUser = location.state?.user;

    if (seededUser) {
      const nextForm = {
        name: seededUser.name || "",
        email: seededUser.email || "",
        phone: seededUser.phone || "",
        society: seededUser.society || "",
        tower: seededUser.tower || "A1",
        flat: seededUser.flat || "",
      };
      setForm(nextForm);
      setInitialForm(nextForm);
      setLoading(false);
      return;
    }

    let ignore = false;

    fetch(`${API_BASE_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          let message = "Failed to fetch profile";
          try {
            const data = await res.json();
            message = data.error || message;
          } catch (_) {}
          throw new Error(message);
        }
        return res.json();
      })
      .then((data) => {
        if (ignore) return;

        const user = data.user || {};
        const nextForm = {
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          society: user.society || "",
          tower: user.tower || "A1",
          flat: user.flat || "",
        };

        setForm(nextForm);
        setInitialForm(nextForm);
        setError("");
      })
      .catch((err) => {
        if (!ignore) setError(err.message || "Could not load profile.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [accessToken, location.state]);

  const selectedSocietyMeta = useMemo(
    () => ALL_SOCIETIES.find((item) => item.society === form.society),
    [form.society]
  );

  const filteredSocieties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALL_SOCIETIES;

    return ALL_SOCIETIES.filter(
      (item) =>
        item.society.toLowerCase().includes(q) ||
        item.locality.toLowerCase().includes(q)
    );
  }, [search]);

  const hasChanges =
    initialForm &&
    JSON.stringify(form) !== JSON.stringify(initialForm);

  if (!accessToken) {
    return <AuthRequired />;
  }

  const validateForm = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Name cannot be empty";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email cannot be empty";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone cannot be empty";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Enter a valid 10-digit number";
    }

    if (!form.society.trim()) {
      nextErrors.society = "Please select your society";
    }

    if (!form.tower.trim()) {
      nextErrors.tower = "Tower cannot be empty";
    }

    if (!form.flat.trim()) {
      nextErrors.flat = "Flat cannot be empty";
    } else if (!/^\d{4}$/.test(form.flat.trim())) {
      nextErrors.flat = "Flat must be 4 digits (e.g. 1205)";
    } else {
      const floor = parseInt(form.flat.trim().slice(0, 2), 10);
      const unit = parseInt(form.flat.trim().slice(2), 10);
      const maxFloor = FLOOR_CONFIG[form.tower] || DEFAULT_MAX_FLOOR;

      if (unit < 1 || unit > 12 || floor < 0 || floor > maxFloor) {
        nextErrors.flat = "Invalid flat number";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    setError("");
  };

  const handleSocietySelect = (society) => {
    updateField("society", society);
    setPickerOpen(false);
    setSearch("");
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!hasChanges) {
      toast.error("No changes to save.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          society: form.society.trim(),
          tower: form.tower.trim(),
          flat: form.flat.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save changes.");
      }

      toast.success("Profile updated successfully!");
      setInitialForm({
        name: data.user?.name || form.name.trim(),
        email: data.user?.email || form.email.trim().toLowerCase(),
        phone: data.user?.phone || form.phone.trim(),
        society: data.user?.society || form.society.trim(),
        tower: data.user?.tower || form.tower.trim(),
        flat: data.user?.flat || form.flat.trim(),
      });

      setTimeout(() => {
        navigate("/profile", { replace: true });
      }, 600);
    } catch (err) {
      const message = err.message || "Could not save changes.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-[#fff6e5] via-[#ffd6a5] to-[#ff8c42] px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="rounded-3xl border border-orange-200 bg-white/90 p-6 shadow-xl backdrop-blur-md md:p-8"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#E53935]">
                  Edit Profile
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Update your personal and delivery details
                </p>
              </div>

              <button
                onClick={() => navigate("/profile")}
                className="rounded-xl border border-orange-200 px-4 py-2 font-semibold text-orange-600 transition hover:bg-orange-50"
              >
                Back
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-600">
                Loading profile...
              </div>
            ) : error && !initialForm ? (
              <div className="py-16 text-center text-red-500 font-semibold">
                {error}
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  <Field
                    label="Full Name"
                    error={fieldErrors.name}
                    input={
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        placeholder="Your full name"
                        className={inputClass(fieldErrors.name)}
                      />
                    }
                  />

                  <Field
                    label="Email Address"
                    error={fieldErrors.email}
                    input={
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="your@email.com"
                        className={inputClass(fieldErrors.email)}
                      />
                    }
                  />

                  <Field
                    label="Mobile Number"
                    error={fieldErrors.phone}
                    input={
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.phone}
                        onChange={(e) =>
                          updateField(
                            "phone",
                            e.target.value.replace(/\D/g, "").slice(0, 10)
                          )
                        }
                        placeholder="10-digit mobile number"
                        className={inputClass(fieldErrors.phone)}
                      />
                    }
                  />

                  <Field
                    label="Select Your Society"
                    error={fieldErrors.society}
                    input={
                      <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className={inputClass(fieldErrors.society, true)}
                      >
                        <div className="flex items-center justify-between gap-3 text-left">
                          <div className="min-w-0">
                            <p
                              className={`text-sm sm:text-base ${
                                form.society ? "text-gray-800" : "text-gray-400"
                              }`}
                            >
                              {form.society || "Choose your society"}
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
                    }
                  />

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field
                      label="Tower"
                      error={fieldErrors.tower}
                      input={
                        <select
                          value={form.tower}
                          onChange={(e) => updateField("tower", e.target.value)}
                          className={inputClass(fieldErrors.tower)}
                        >
                          {towers.map((tower) => (
                            <option key={tower} value={tower}>
                              {tower}
                            </option>
                          ))}
                        </select>
                      }
                    />

                    <Field
                      label="Flat Number"
                      error={fieldErrors.flat}
                      input={
                        <input
                          type="text"
                          value={form.flat}
                          onChange={(e) =>
                            updateField(
                              "flat",
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="e.g. 1205"
                          className={inputClass(fieldErrors.flat)}
                        />
                      }
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex-1 rounded-xl border border-orange-300 py-3 font-semibold text-orange-600 transition hover:bg-orange-50"
                  >
                    Discard Changes
                  </button>

                  <button
                    type="button"
                    disabled={saving || !hasChanges}
                    onClick={handleSave}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] py-3 font-semibold text-white shadow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
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
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-300"
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
                        form.society === item.society
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

function Field({ label, input, error }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-gray-800 sm:text-sm">
        {label}
      </label>
      {input}
      {error ? (
        <p className="mt-1 text-[10px] text-red-500 sm:text-xs">{error}</p>
      ) : null}
    </div>
  );
}

function inputClass(hasError, isButton = false) {
  return [
    "w-full rounded-xl border px-3 py-2.5 text-gray-800 transition focus:outline-none focus:ring-4 sm:px-4 sm:py-3",
    hasError
      ? "border-red-400 focus:ring-red-300"
      : "border-gray-300 focus:ring-orange-300",
    isButton ? "text-left" : "",
  ].join(" ");
}
