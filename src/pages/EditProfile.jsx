import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function EditProfile() {
  const { accessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
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
          } catch {
            message = "Failed to fetch profile";
          }
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

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    setError("");
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

                  <div className="rounded-2xl border border-orange-100 bg-[#fffaf8] p-4 text-sm text-black/60">
                    Delivery addresses are managed separately so you can save more than one location.
                    <button type="button" onClick={() => navigate("/location")} className="mt-3 block font-bold text-[#E53935] hover:underline">
                      Manage saved addresses
                    </button>
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
