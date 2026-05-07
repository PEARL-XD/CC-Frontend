import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Load Razorpay script once
const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, user } = useContext(AuthContext);
  const { clearCart } = useCart();

  const [loading, setLoading] = useState(false);

  const { cartItems, schedule } = location.state || {};

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const markPaymentFailed = async (localOrderId, paymentStatus = "FAILED") => {
    if (!localOrderId || !accessToken) return false;

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/orders/payment-failed`,
        { localOrderId, paymentStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      console.log("payment-failed response:", res.data);
      return true;
    } catch (err) {
      console.error(
        "Failed to mark order as payment-failed:",
        err.response?.data || err.message
      );
      return false;
    }
  };

  const goToOrdersAfterFailure = async (localOrderId, paymentStatus, message) => {
    await markPaymentFailed(localOrderId, paymentStatus);

    if (message) {
      alert(message);
    }

    navigate("/orderspage");
  };

  const handlePayNow = async () => {
    try {
      if (!accessToken) {
        alert("Please log in again to continue.");
        navigate("/login");
        return;
      }

      setLoading(true);

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay failed to load. Check your connection.");
        setLoading(false);
        return;
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/api/orders/create`,
        { cartItems, schedule },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const {
        razorpayKeyId,
        amount,
        currency,
        razorpayOrderId,
        localOrderId,
      } = data;

      setLoading(false);

      let paymentHandled = false;

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        order_id: razorpayOrderId,
        name: "CleanCuts",
        description: "Order Payment",
        prefill: {
          name: user?.name || "",
          contact: user?.phone || "",
          email: user?.email || "",
        },
        modal: {
          ondismiss: async () => {
            if (paymentHandled) return;
            paymentHandled = true;
            setLoading(false);

            await goToOrdersAfterFailure(
              localOrderId,
              "CANCELLED",
              "Payment was cancelled."
            );
          },
        },
        handler: async function (response) {
          if (paymentHandled) return;
          paymentHandled = true;

          try {
            await axios.post(
              `${API_BASE_URL}/api/orders/verify`,
              {
                localOrderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
          } catch (err) {
            console.error(
              "Payment verification failed:",
              err.response?.data || err.message
            );

            await goToOrdersAfterFailure(
              localOrderId,
              "FAILED",
              "Payment verification failed. Please contact support."
            );
            return;
          }

          try {
            await clearCart();
          } catch (e) {
            console.warn("Cart clear failed (safe to ignore):", e);
          }

          navigate("/orderspage");
        },
        theme: {
          color: "#E53935",
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", async (response) => {
        if (paymentHandled) return;
        paymentHandled = true;

        console.error("Payment failed:", response.error);
        setLoading(false);

        await goToOrdersAfterFailure(
          localOrderId,
          "FAILED",
          `Payment failed: ${
            response.error.description ||
            "Something went wrong. Please try again."
          }`
        );
      });

      razorpayInstance.open();
    } catch (err) {
      console.error(
        "Payment initiation failed:",
        err.response?.data || err.message
      );
      alert("Payment initiation failed. Try again.");
      setLoading(false);
    }
  };

  if (!cartItems || !accessToken) return null;

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold mb-6">Review & Pay</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-2">
        {cartItems.map((item) => (
          <div
            key={`${item._id}-${item.selectedSize}`}
            className="flex justify-between text-sm"
          >
            <span>
              {item.name} ({item.selectedSize}g × {item.quantity})
            </span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {schedule && (
        <p className="text-gray-600 mb-4">
          <span className="font-semibold">Scheduled:</span> {schedule}
        </p>
      )}

      <div className="text-xl font-bold mb-6">Total: ₹{total.toFixed(2)}</div>

      <button
        onClick={handlePayNow}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold shadow hover:scale-105 transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay with Razorpay"}
      </button>
    </div>
  );
}
