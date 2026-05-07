import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Profile() {
  const { accessToken } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) return;

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
        if (!ignore) {
          setUser(data.user);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });

    return () => {
      ignore = true;
    };
  }, [accessToken]);

  if (!accessToken) {
    return <AuthRequired />;
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="text-center mt-20 text-red-500 font-semibold">
          {error}
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="text-center mt-20 text-gray-600 text-lg">
          Loading profile...
        </div>
      </>
    );
  }

  const initial = user.name?.trim()?.[0]?.toUpperCase() || "?";

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-[#fff6e5] via-[#ffd6a5] to-[#ff8c42] px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-3xl border border-orange-200 bg-white/90 shadow-xl backdrop-blur-md"
          >
            <div className="bg-gradient-to-r from-[#fb923c] to-[#ef4444] px-6 py-8 md:px-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-[#E53935] shadow">
                    {initial}
                  </div>

                  <div>
                    <h1 className="text-3xl font-extrabold text-white">
                      {user.name || "My Profile"}
                    </h1>
                    <p className="mt-1 text-sm text-white/80">
                      Manage your personal details
                    </p>
                    {user.phone && (
                      <p className="mt-2 text-sm font-medium text-white">
                        {user.phone}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate("/home")}
                  className="rounded-xl bg-white/15 px-4 py-2 font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
                >
                  Back
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ProfileField label="Name" value={user.name} />
                <ProfileField label="Email Address" value={user.email} />
                <ProfileField label="Phone Number" value={user.phone} />
                <ProfileField label="Society" value={user.society} />
                <ProfileField label="Tower" value={user.tower} />
                <ProfileField label="Flat Number" value={user.flat} />
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  className="flex-1 rounded-xl border border-orange-300 py-3 font-semibold text-orange-600 transition hover:bg-orange-50"
                  onClick={() => navigate("/orderspage")}
                >
                  View Orders
                </button>

                <button
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] py-3 font-semibold text-white shadow transition hover:scale-[1.02]"
                  onClick={() =>
                    navigate("/edit-profile", {
                      state: { user },
                    })
                  }
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-900">
        {value || "-"}
      </div>
    </div>
  );
}
