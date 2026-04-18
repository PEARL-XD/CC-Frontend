import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Profile() {
  const { accessToken } = useContext(AuthContext);
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
if (!accessToken) {
  return <AuthRequired />;
}
  useEffect(() => {
    if (!accessToken) return;

    fetch(`${API_BASE_URL}/api/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => setError(err.message));
  }, [accessToken]);

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

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-[#fff6e5] via-[#ffd6a5] to-[#ff8c42] flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl bg-white bg-opacity-90 backdrop-blur-md rounded-3xl shadow-xl border border-orange-200 p-8 md:p-12"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#E53935]">
                My Profile
              </h1>
              <p className="text-sm text-gray-600">
                Manage your personal details
              </p>
            </div>

            <button
              onClick={() => navigate("/home")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white font-semibold shadow hover:scale-105 transition"
            >
              Back
            </button>
          </div>

          {/* Profile Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileField label="Name" value={user.name} />
            <ProfileField label="Email address" value={user.email} />
            <ProfileField label="Phone Number" value={user.phone} />
            <ProfileField label="Tower" value={user.tower} />
            <ProfileField label="Flat Number" value={user.flat} />
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              className="flex-1 py-3 rounded-xl border border-orange-300 text-orange-600 font-semibold hover:bg-orange-50 transition"
              onClick={() => navigate("/orderspage")}
            >
              View Orders
            </button>

            <button
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white font-semibold shadow hover:scale-105 transition"
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/* ---------- Small Reusable Field ---------- */

function ProfileField({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 font-medium">
        {value || "-"}
      </div>
    </div>
  );
}
