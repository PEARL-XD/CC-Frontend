import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const statusStyles = {
  PLACED: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PACKED: "bg-yellow-100 text-yellow-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

/* ================================
   DATA HOOK
================================ */
function useOrdersLive(accessToken) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const intervalRef = useRef(null);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/orders/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setOrders(data.orders || []);
      setErrorMsg("");
    } catch (err) {
      console.log(err);
      
      setErrorMsg("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    fetchOrders();

    // Poll every 10s only when tab is visible
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") fetchOrders();
    }, 10000);

    // FIX: immediately refetch when user returns to tab after being away
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchOrders();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [accessToken, fetchOrders]);

  return { orders, loading, errorMsg };
}

/* ================================
   PAGE
================================ */
export default function OrdersPage() {
  const { accessToken } = useContext(AuthContext);

  // FIX: hook is always called — no early return before it
  const { orders, loading, errorMsg } = useOrdersLive(accessToken);

  if (!accessToken) {
    return <AuthRequired />;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="text-center p-8 text-gray-600">Loading orders…</div>
      </>
    );
  }

  if (errorMsg) {
    return (
      <>
        <Navbar />
        <div className="text-center p-8 text-red-500">{errorMsg}</div>
      </>
    );
  }

  if (!orders.length) {
    return (
      <>
        <Navbar />
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-2">My Orders</h1>
          <p className="text-gray-500">No orders yet</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-extrabold">My Orders</h1>

        {orders.map((order) => {
          const statusClass =
            statusStyles[order.orderStatus] || "bg-gray-100 text-gray-700";

          return (
            <div
              key={order._id}
              className="bg-white border rounded-2xl shadow-sm p-4 space-y-4"
            >
              {/* HEADER */}
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <div className="text-xs text-gray-400">
                    Order #{order._id.slice(-8)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 text-xs rounded-full ${statusClass}`}>
                    {order.orderStatus.replace(/_/g, " ")}
                  </span>
                  <span className="px-3 py-1 text-xs rounded-full bg-gray-100">
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* ITEMS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
                {order.items.map((item) => (
                  <div key={item._id || item.name} className="flex gap-3 items-center">
                    <img
                      src={item.img || "/placeholder.png"}
                      alt={item.name}
                      className="w-14 h-14 object-cover rounded-lg border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {item.selectedSize}g × {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-xs text-gray-500">
                  Updated {new Date(order.updatedAt).toLocaleString()}
                </span>
                <span className="text-lg font-extrabold">
                  ₹{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}