import React, { useState, useRef, useEffect } from "react";
import { useNavigate,useLocation } from "react-router-dom";
import { TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import Navbar from "../components/Navbar";
import AuthRequired from "../components/AuthRequired";


export default function CartPage() {
  const location = useLocation();
  const { accessToken } = useContext(AuthContext);
  const { cartItems, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const scheduleRef = useRef(null);
if (!accessToken) {
  return <AuthRequired />;
}
  useEffect(() => {
    function handleClickOutside(e) {
      if (scheduleRef.current && !scheduleRef.current.contains(e.target)) {
        setScheduleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleScheduleSelect = (timeSlot) => {
    navigate("/paymentpage", { state: { cartItems, schedule: timeSlot } });
    setScheduleOpen(false);
  };

  const handleBuyNow = () => {
    navigate("/paymentpage", { state: { cartItems } });
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatCurrency = (amount) => `₹${amount.toFixed(2)}`;

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-4 md:p-6 pb-40">
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
            {/* animated list */}
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
                    src={item.img}
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
                          <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-start gap-2 md:gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="font-semibold text-gray-900">{formatCurrency(item.price)}</span>
                          <span className="text-xs text-gray-500">per item</span>
                        </div>

                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          <div className="inline-flex items-center border rounded-lg px-2 py-1 gap-2 select-none">
                            <button
                              onClick={() =>
                                updateQuantity(item._id, item.selectedSize, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              className="p-1 rounded disabled:opacity-40"
                              aria-label={`Decrease quantity for ${item.name}`}
                            >
                              <MinusIcon className="w-4 h-4 text-gray-700" />
                            </button>

                            <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>

                            <button
                              onClick={() =>
                                updateQuantity(item._id, item.selectedSize, item.quantity + 1)
                              }
                              className="p-1 rounded"
                              aria-label={`Increase quantity for ${item.name}`}
                            >
                              <PlusIcon className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>

                          {/* Subtotal (mobile-visible) */}
                          <div className="sm:hidden text-sm font-semibold text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="hidden sm:inline-block text-sm font-medium text-gray-700">Size:</span>
                            <span className="inline-block bg-gray-100 text-gray-800 text-sm px-2 py-0.5 rounded-md">{item.selectedSize}g</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extra row for mobile showing price + actions */}
                    <div className="mt-3 flex items-center justify-between sm:justify-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-sm font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</div>

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

                      {/* On larger screens show attributes/stock info */}
                      <div className="ml-auto text-xs text-gray-500 hidden sm:block">In stock</div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-white to-gray-50 border border-orange-100 rounded-xl p-4 md:p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500">Estimated total</div>
                <div className="text-2xl md:text-3xl font-extrabold text-gray-900">{formatCurrency(totalPrice)}</div>
                <div className="text-xs text-gray-500 mt-1">Taxes and delivery calculated at checkout</div>
              </div>

              {/* intentionally hidden to avoid duplicate CTA – bottom bar handles actions */}
              <div className="hidden" aria-hidden="true" />
            </div>
          </section>
        )}

        {/* Always-visible single fixed bottom bar.
            Total on left; Schedule + Checkout aligned right (Option B) */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full bg-white p-3 shadow-lg z-50 border-t border-orange-100 safe-area-inset-bottom">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(totalPrice)}</div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                {/* Schedule button + dropdown (aligned right) */}
                <div className="relative" ref={scheduleRef}>
                  <button
                    onClick={() => setScheduleOpen((s) => !s)}
                    className="px-3 py-2 bg-[#fb923c] hover:bg-[#ef4444] text-white rounded-md font-semibold shadow-sm"
                    aria-haspopup="true"
                    aria-expanded={scheduleOpen}
                  >
                    Schedule
                  </button>

                  {scheduleOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 w-56 bg-white shadow-lg rounded-lg text-center cursor-pointer border border-orange-100 z-50"
                      role="menu"
                    >
                      {["Early Morning 5-8 AM", "Afternoon 12-2 PM", "Evening 6-8 PM"].map((slot) => (
                        <li
                          key={slot}
                          className="py-3 hover:bg-orange-50 rounded-lg"
                          onClick={() => handleScheduleSelect(slot)}
                          role="menuitem"
                          tabIndex={0}
                        >
                          {slot}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </div>

                <button
                  onClick={handleBuyNow}
                  disabled={cartItems.length === 0}
                  className="px-4 py-2 bg-[#ef4444] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-semibold shadow-sm"
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
