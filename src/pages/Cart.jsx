import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  InformationCircleIcon,
} from "@heroicons/react/outline";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";

const DELIVERY_SLOTS = [
  "Early Morning 5-8 AM",
  "Afternoon 12-2 PM",
  "Evening 6-8 PM",
];

export default function CartPage() {
  const { accessToken } = useContext(AuthContext);
  const { cartItems, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [silentDelivery, setSilentDelivery] = useState(false);

  const scheduleRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (scheduleRef.current && !scheduleRef.current.contains(e.target)) {
        setScheduleOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) {
      setSelectedSchedule(null);
      setSilentDelivery(false);
      setScheduleOpen(false);
    }
  }, [cartItems.length]);

  if (!accessToken) {
    return <AuthRequired />;
  }

  const handleScheduleSelect = (timeSlot) => {
    setSelectedSchedule(timeSlot);
    setScheduleOpen(false);
  };

  const handleClearSchedule = () => {
    setSelectedSchedule(null);
    setScheduleOpen(false);
  };

  const handleBuyNow = () => {
    navigate("/paymentpage", {
      state: {
        cartItems,
        schedule: selectedSchedule,
        silentDelivery,
      },
    });
  };

  const handleIncrease = (item) => {
    if (item.quantity >= 10) return;
    updateQuantity(item._id, item.selectedSize, item.quantity + 1);
  };

  const handleDecrease = (item) => {
    updateQuantity(item._id, item.selectedSize, item.quantity - 1);
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  const deliverySummary = selectedSchedule
    ? selectedSchedule
    : silentDelivery
      ? "Normal timing with silent delivery"
      : "Normal delivery in 45-90 minutes";

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-4 md:p-6 pb-44">
        <h1 className="text-2xl md:text-4xl font-extrabold mb-6 md:mb-10 text-gray-900">
          Your Cart
        </h1>

        {cartItems.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-gray-500 text-lg">Your cart is empty.</p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-[#fb923c] hover:bg-[#ef4444] text-white rounded-md shadow-sm"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <section className="space-y-4 md:space-y-6">
            <AnimatePresence initial={false}>
              {cartItems.map((item) => (
                <motion.article
                  key={`${item._id}-${item.selectedSize}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="bg-white border border-orange-100 rounded-xl p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 md:gap-6 items-start"
                  aria-label={`${item.name} in cart`}
                >
                  <img
                    src={item.img || "/placeholder.png"}
                    alt={item.name}
                    className="w-full md:w-28 lg:w-32 h-44 md:h-28 object-cover rounded-lg flex-shrink-0 mx-auto md:mx-0"
                    loading="lazy"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                          {item.name}
                        </h2>
                        {item.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-start gap-2 md:gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-xs text-gray-500">per item</span>
                        </div>

                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          <div className="inline-flex items-center border rounded-lg px-2 py-1 gap-2 select-none">
                            <button
                              onClick={() => handleDecrease(item)}
                              disabled={item.quantity <= 1}
                              className="p-1 rounded disabled:opacity-40"
                              aria-label={`Decrease quantity for ${item.name}`}
                            >
                              <MinusIcon className="w-4 h-4 text-gray-700" />
                            </button>

                            <span className="w-8 text-center font-medium text-gray-900">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => handleIncrease(item)}
                              disabled={item.quantity >= 10}
                              className="p-1 rounded disabled:opacity-40"
                              aria-label={`Increase quantity for ${item.name}`}
                            >
                              <PlusIcon className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          <div className="sm:hidden text-sm font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-block text-sm font-medium text-gray-700">
                              Size:
                            </span>
                            <span className="inline-block bg-gray-100 text-gray-800 text-sm px-2 py-0.5 rounded-md">
                              {item.selectedSize}g
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-sm font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </div>

                        <button
                          onClick={() => removeItem(item._id, item.selectedSize)}
                          className="inline-flex items-center gap-2 text-red-600 hover:bg-red-50 px-2 py-1 rounded-md"
                          aria-label={`Remove ${item.name} from cart`}
                          title="Remove item"
                        >
                          <TrashIcon className="w-5 h-5" />
                          <span className="hidden sm:inline text-sm">Remove</span>
                        </button>
                      </div>

                      <div className="ml-auto text-xs text-gray-500 hidden sm:block">
                        In stock
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            <div className="bg-gradient-to-r from-white to-gray-50 border border-orange-100 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Estimated total</div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {formatCurrency(totalPrice)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Taxes and delivery calculated at checkout
                </div>
              </div>
              <div className="hidden" aria-hidden="true" />
            </div>
          </section>
        )}

        {cartItems.length > 0 && (
          <>
            {/* Mobile floating info button only */}
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="md:hidden fixed left-4 bottom-28 z-40 inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-[#fb923c] to-[#ef4444] shadow-lg text-white hover:scale-105 transition-transform"
              title="Delivery options info"
            >
              <InformationCircleIcon className="w-6 h-6" />
            </button>

            <div className="fixed bottom-0 left-0 w-full bg-white p-3 shadow-lg z-50 border-t border-orange-100 safe-area-inset-bottom">
              <div className="max-w-5xl mx-auto flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>

                  {/* Desktop tray info button */}
                  <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-md border border-orange-200 text-[#ef4444] bg-white hover:bg-orange-50 font-medium"
                    title="Delivery options info"
                  >
                    <InformationCircleIcon className="w-5 h-5" />
                    <span>Delivery info</span>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={cartItems.length === 0}
                    className="px-4 py-2 bg-[#ef4444] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-semibold shadow-sm"
                  >
                    Checkout
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative" ref={scheduleRef}>
                    <button
                      onClick={() => setScheduleOpen((s) => !s)}
                      className={`px-3 py-2 rounded-md font-semibold shadow-sm border transition ${
                        selectedSchedule
                          ? "bg-red-50 text-[#ef4444] border-red-200"
                          : "bg-[#fb923c] hover:bg-[#ef4444] text-white border-transparent"
                      }`}
                      aria-haspopup="true"
                      aria-expanded={scheduleOpen}
                    >
                      {selectedSchedule || "Schedule"}
                    </button>

                    <AnimatePresence>
                      {scheduleOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 mb-2 w-72 bg-white shadow-lg rounded-xl border border-orange-100 z-50 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={handleClearSchedule}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-orange-50"
                          >
                            <div className="font-semibold text-gray-900">
                              Normal delivery
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              No schedule. We try to deliver in 45-90 minutes.
                            </div>
                          </button>

                          {DELIVERY_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleScheduleSelect(slot)}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-b-0 border-orange-50"
                            >
                              <div className="font-medium text-gray-900">
                                {slot}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Deliver during this selected time slot.
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSilentDelivery((v) => !v)}
                    className={`px-3 py-2 rounded-md font-semibold shadow-sm border transition ${
                      silentDelivery
                        ? "bg-red-50 text-[#ef4444] border-red-200"
                        : "bg-white text-gray-700 border-orange-200 hover:bg-orange-50"
                    }`}
                  >
                    Silent delivery
                  </button>

                  <div className="text-xs text-gray-500">
                    {deliverySummary}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {infoOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInfoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md bg-white rounded-2xl border border-orange-100 shadow-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-extrabold text-gray-900">
                Delivery options
              </h2>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                  <div className="font-semibold text-gray-900">
                    Normal delivery
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    If you do not select any extra option, we try to deliver as
                    soon as possible, usually within 45-90 minutes.
                  </div>
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                  <div className="font-semibold text-gray-900">Schedule</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Choose a delivery slot if you want the order delivered in a
                    specific time window.
                  </div>
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                  <div className="font-semibold text-gray-900">
                    Silent delivery
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    No contact delivery. The rider can leave the order outside
                    the front door when possible, without ringing or calling
                    unnecessarily.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white font-semibold"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
