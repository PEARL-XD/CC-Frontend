import React, { useState, useEffect, useRef } from "react";
import raw_image from "../assets/images/raw.png";
import cooked_image from "../assets/images/cooked.png";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";
import { WhatToExpect, AppDownloadBanner, Footer } from "./HomepageSections";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function MainPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const { addItem } = useCart(); // <-- use global cart

  // ref to track items that are currently being added (prevents double-add)
  const pendingAddsRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    fetch(`${API_BASE_URL}/api/items`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const mappedSections = (Array.isArray(data) ? data : []).map((section) => ({
          ...section,
          image: section.title === "Uncooked" ? raw_image : cooked_image,
        }));
        setSections(mappedSections);
      })
      .catch((err) => {
        console.error("Failed to load items:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // NOTE: auto-advance removed — user must click the CTA to change the banner
  const handleSlide = () => {
    setFade(false);
    setTimeout(() => {
      setIndex((prev) => (sections.length ? (prev + 1) % sections.length : 0));
      setFade(true);
    }, 400);
  };

  if (sections.length === 0) {
    return <div className="text-center mt-16 text-xl">Loading items...</div>;
  }

  // Add to cart with a sensible default size (1000g) and quantity 1
  const addToCartHandler = (item) => {
    if (!item) return;
    if (item?.isOutOfStock) return; // prevent add-to-cart if out of stock

    const key = `${item._id || item.id}-${1000}`; // key uses id + selectedSize (1000g default)

    // If this item is currently pending addition, ignore duplicate clicks
    if (pendingAddsRef.current.has(key)) {
      return;
    }

    // mark pending
    pendingAddsRef.current.add(key);

    // prepare normalized item per your CartContext's validation
    const newCartItem = {
      _id: item._id || item.id,
      name: item.name || item.title || "Item",
      price: Number(item.price) || 0, // CartContext expects price: number
      selectedSize: 1000, // default 1000g
      quantity: 1,
      img: item.img || item.image || "",
    };

    try {
      addItem(newCartItem); // add to global cart (called only once per click)
    } catch (err) {
      console.error("addItem failed:", err);
    }

    // visual feedback
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    // release the lock after a short delay so user can add again if they really want to
    const RELEASE_DELAY = 800; // milliseconds
    setTimeout(() => {
      pendingAddsRef.current.delete(key);
    }, RELEASE_DELAY);
  };

  const currentSection = sections[index] || { title: "", articles: [], image: raw_image };
  const currentTitle = currentSection.title || "";
  const nextTitle = currentTitle === "Uncooked" ? "Cooked" : "Uncooked";
  const buttonLabel = `Looking for ${nextTitle}`;

  // motion variants
  const cardVariants = {
    initial: { opacity: 0, y: 10, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    hover: { scale: 1.02, y: -4 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Banner Carousel (manual only) */}
      <div
        className="relative w-full"
        style={{ height: "58vh", maxHeight: "600px" }}
        aria-hidden="false"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSection.title + index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
            className={`absolute inset-0 ${fade ? "opacity-100" : "opacity-0"}`}
          >
            <img
              src={currentSection.image}
              alt={currentSection.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            <h2 className="absolute left-6 bottom-20 text-white text-4xl md:text-6xl font-extrabold drop-shadow-2xl select-none z-10">
              {currentSection.title}
            </h2>

            <button
              onClick={handleSlide}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 md:px-8 py-2 md:py-3 bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white rounded-full font-semibold shadow-lg hover:scale-105 transition-transform z-10 focus:outline-none focus:ring-4 focus:ring-orange-200"
              aria-label={buttonLabel}
              title={buttonLabel}
            >
              {buttonLabel}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Articles Grid */}
      <div className="w-full max-w-7xl mx-auto my-10 px-4 md:px-6 xl:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {currentSection.articles.map((item, idx) => {
            const key = `${item._id || item.id}-1000`;
            const isPending = pendingAddsRef.current.has(key);
            const isOutOfStock = item.isOutOfStock === true;

            return (
              <motion.article
                key={item._id || item.id || idx}
                layout
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                variants={cardVariants}
                transition={{ duration: 0.18 }}
                className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative ${
                  isOutOfStock ? "opacity-60 grayscale" : "hover:shadow-md"
                }`}
              >
                {/* Product Image and Plus Icon overlay */}
                <div className="relative rounded-t-xl overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-44 object-cover rounded-t-xl"
                    loading="lazy"
                  />

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                      <span className="px-3 py-1 rounded-full bg-white text-red-600 font-bold text-sm shadow">
                        Out of stock
                      </span>
                    </div>
                  )}

                  {/* plus button - accessible */}
                  <button
                    title={`Add ${item.name} to cart`}
                    className={`absolute bottom-3 right-3 bg-white border border-orange-200 shadow rounded-full w-9 h-9 flex justify-center items-center transition transform focus:outline-none focus:ring-2 focus:ring-orange-200 ${
                      isPending || isOutOfStock
                        ? "opacity-60 pointer-events-none"
                        : "hover:bg-orange-50 hover:-translate-y-0.5"
                    }`}
                    onClick={() => addToCartHandler(item)}
                    aria-label={`Add ${item.name} to cart`}
                    aria-disabled={isPending || isOutOfStock}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-[#E53935]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                    </svg>
                  </button>
                </div>

                {/* Info Section */}
                <div className="px-4 py-3 flex flex-col gap-2 flex-1">
                  <div className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {item.name}
                  </div>
                  {item.desc && <div className="text-xs text-gray-500 line-clamp-3">{item.desc}</div>}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-baseline gap-3">
                      <span className="text-lg font-bold text-[#E53935]">₹{item.price}</span>
                      <span className="text-sm text-gray-400 line-through">₹{item.oldprice || "199"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isOutOfStock}
                        className={`px-3 py-1 rounded-md border shadow-sm text-sm font-medium transition ${
                          isOutOfStock
                            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (!isOutOfStock) navigate(`/product/${item._id || item.id}`);
                        }}
                      >
                        {isOutOfStock ? "Out of stock" : "Customize"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <WhatToExpect />
      <AppDownloadBanner />
      <Footer />

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 md:right-12 bg-[#ef4444] text-white py-3 px-6 rounded shadow-lg z-50"
            role="status"
            aria-live="polite"
          >
            Item added to cart!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}