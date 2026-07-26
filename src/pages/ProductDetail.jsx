import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import { useCart } from "../contexts/CartContext.jsx";
import {
  defaultDisplayPriceForItem,
  defaultSelectedSizeForItem,
  getOldPriceForItem,
  getPackPriceForItem,
  packDisplayText,
  packOptionsForItem,
  pricingModeForItem,
} from "../utils/packPricing";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const RUPEE = "\u20B9";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetch(`${API_BASE_URL}/api/items/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setItem(data || null);
        setSelectedSize(defaultSelectedSizeForItem(data));
        setQuantity(1);
        setActiveImageIndex(0);
      })
      .catch((error) => {
        console.error("Failed to load product:", error);
        if (mounted) setItem(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    setSuggestionsLoading(true);

    fetch(`${API_BASE_URL}/api/items`)
      .then((res) => res.json())
      .then((sections) => {
        if (!mounted) return;
        const allItems = Array.isArray(sections)
          ? sections.flatMap((section) => section?.articles || [])
          : [];
        const filtered = allItems.filter((candidate) => candidate?._id !== id);
        setSuggestions(filtered.slice(0, 6));
      })
      .catch((error) => {
        console.error("Failed to load suggestions:", error);
        if (mounted) setSuggestions([]);
      })
      .finally(() => {
        if (mounted) setSuggestionsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const pricingMode = useMemo(() => pricingModeForItem(item), [item]);
  const packOptions = useMemo(() => packOptionsForItem(item), [item]);
  const effectiveSelectedSize = selectedSize || defaultSelectedSizeForItem(item);

  const unitPrice = useMemo(() => {
    if (!item) return 0;
    if (pricingMode === "single") return defaultDisplayPriceForItem(item);
    return getPackPriceForItem(item, effectiveSelectedSize);
  }, [effectiveSelectedSize, item, pricingMode]);

  const oldPrice = useMemo(() => {
    if (!item) return null;
    if (pricingMode === "single") return getOldPriceForItem(item, 0);
    return getOldPriceForItem(item, effectiveSelectedSize);
  }, [effectiveSelectedSize, item, pricingMode]);

  const totalPrice = unitPrice * quantity;
  const totalWeight = effectiveSelectedSize * quantity;
  const totalProtein = ((Number(item?.proteinPer100g) || 0) * totalWeight) / 100;
  const totalCarbs = ((Number(item?.carbsPer100g) || 0) * totalWeight) / 100;
  const totalCalories = ((Number(item?.caloriesPer100g) || 0) * totalWeight) / 100;

  const isOutOfStock = item?.isOutOfStock === true;
  const showNutrition =
    pricingMode !== "cooked" &&
    (totalProtein > 0 || totalCarbs > 0 || totalCalories > 0);
  const canSelectSize = pricingMode !== "single" && packOptions.length > 0;

  const images =
    (item?.gallery?.length > 0 ? item.gallery : [item?.img]).filter(Boolean);
  const safeIndex = Math.min(
    activeImageIndex,
    Math.max(images.length - 1, 0),
  );

  const incrementQuantity = () => setQuantity((current) => Math.min(current + 1, 10));
  const decrementQuantity = () => setQuantity((current) => Math.max(current - 1, 1));

  const handleAddToCart = () => {
    if (!item || isOutOfStock) return;

    addItem({
      _id: item._id,
      name: item.name,
      price: unitPrice,
      selectedSize: pricingMode === "single" ? 0 : effectiveSelectedSize,
      quantity,
      img: item.img,
      category: item.category,
    });

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      navigate("/cart");
    }, 1200);
  };

  const selectedSizeLabel =
    pricingMode === "single"
      ? "Single"
      : packDisplayText(effectiveSelectedSize, item);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-[32px] border border-black/8 bg-white/80 p-6">
            <div className="h-8 w-40 rounded-full bg-black/6" />
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="h-[420px] rounded-[28px] bg-black/5" />
              <div className="space-y-4">
                <div className="h-10 w-2/3 rounded bg-black/6" />
                <div className="h-5 w-1/2 rounded bg-black/5" />
                <div className="h-24 rounded bg-black/5" />
                <div className="h-12 rounded-full bg-black/6" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#E53935]">
            Product unavailable
          </p>
          <h1 className="mt-3 text-3xl font-black text-[#161616]">
            We could not load this product right now.
          </h1>
          <p className="mt-3 text-base leading-8 text-black/65">
            Please go back to the category and try again.
          </p>
          <Link
            to="/home"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fb923c] to-[#ef4444] px-5 py-3 text-sm font-bold text-white shadow-lg"
          >
            Back to categories
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf6_0%,#fff4eb_100%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 xl:gap-12">
            <section>
              <div className="overflow-hidden rounded-[32px] border border-black/8 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
                <img
                  src={images[safeIndex] || "/placeholder.png"}
                  alt={item.name}
                  className="h-[320px] w-full object-cover sm:h-[420px] lg:h-[520px]"
                />
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                        safeIndex === index
                          ? "border-[#ef4444]"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={src}
                        alt={`${item.name} thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col">
              <div className="rounded-[32px] border border-black/8 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#E53935]">
                      {item.category || "Product"}
                    </p>
                    <h1 className="mt-2 text-3xl font-black leading-tight text-gray-900 sm:text-4xl">
                      {item.name}
                    </h1>
                  </div>

                  {isOutOfStock && (
                    <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                      Out of stock
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-end gap-4">
                  <div>
                    <span className="block text-sm font-semibold uppercase tracking-[0.22em] text-black/35">
                      Price
                    </span>
                    <div className="mt-1 flex flex-wrap items-end gap-3">
                      <span className="text-3xl font-black text-[#ef4444] sm:text-4xl">
                        {RUPEE}
                        {Number(unitPrice || 0).toFixed(0)}
                      </span>
                      {oldPrice != null && Number(oldPrice) > Number(unitPrice || 0) && (
                        <span className="text-lg font-semibold text-gray-400 line-through">
                          {RUPEE}
                          {Number(oldPrice).toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-full bg-[#fff4eb] px-4 py-2 text-sm font-semibold text-[#9a4d18]">
                    {selectedSizeLabel}
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-black/35">
                  Total
                </p>
                <p className="mt-1 text-2xl font-black text-gray-900">
                  {RUPEE}
                  {Number(totalPrice || 0).toFixed(0)}
                </p>

                {item.longdesc && (
                  <div className="mt-5 text-sm leading-7 text-gray-700 sm:text-base sm:leading-8">
                    {item.longdesc}
                  </div>
                )}

                {canSelectSize && (
                  <div className="mt-6">
                    <h3 className="text-sm font-extrabold uppercase tracking-[0.22em] text-black/40">
                      Choose size
                    </h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {packOptions.map((option) => {
                        const active = option.grams === effectiveSelectedSize;
                        return (
                          <button
                            key={`${option.grams}-${option.label}`}
                            type="button"
                            onClick={() => {
                              if (!isOutOfStock) setSelectedSize(option.grams);
                            }}
                            className={`rounded-[22px] border px-4 py-4 text-left transition ${
                              active
                                ? "border-[#ef4444] bg-[#fff4ef] shadow-sm"
                                : "border-black/8 bg-white hover:border-[#ef4444]/20"
                            } ${
                              isOutOfStock ? "cursor-not-allowed opacity-60" : ""
                            }`}
                          >
                            <div className="text-base font-black text-[#161616]">
                              {option.label}
                            </div>
                            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/35">
                              {option.rangeLabel}
                            </div>
                            <div className="mt-3 text-lg font-black text-[#ef4444]">
                              {RUPEE}
                              {Number(option.price || 0).toFixed(0)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-extrabold uppercase tracking-[0.22em] text-black/40">
                    Quantity
                  </span>
                  <div className="inline-flex items-center rounded-full border border-black/8 bg-white px-2 py-1 shadow-sm">
                    <button
                      type="button"
                      onClick={decrementQuantity}
                      disabled={isOutOfStock}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-black transition ${
                        isOutOfStock
                          ? "cursor-not-allowed text-black/25"
                          : "text-[#ef4444] hover:bg-[#fff2ec]"
                      }`}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-lg font-black text-gray-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={incrementQuantity}
                      disabled={isOutOfStock}
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xl font-black transition ${
                        isOutOfStock
                          ? "cursor-not-allowed text-black/25"
                          : "text-[#ef4444] hover:bg-[#fff2ec]"
                      }`}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>

                {showNutrition && (
                  <div className="mt-6 grid grid-cols-3 gap-3 rounded-[24px] border border-black/8 bg-[#fffaf8] p-4 text-center">
                    <div>
                      <span className="block text-2xl">🍗</span>
                      <span className="block text-base font-black text-gray-900">
                        {totalProtein.toFixed(1)}g
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-black/35">
                        Protein
                      </span>
                    </div>
                    <div>
                      <span className="block text-2xl">🌾</span>
                      <span className="block text-base font-black text-gray-900">
                        {totalCarbs.toFixed(1)}g
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-black/35">
                        Carbs
                      </span>
                    </div>
                    <div>
                      <span className="block text-2xl">🔥</span>
                      <span className="block text-base font-black text-gray-900">
                        {totalCalories.toFixed(0)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-black/35">
                        Calories
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`mt-6 w-full rounded-full py-4 text-lg font-black shadow-lg transition ${
                    isOutOfStock
                      ? "cursor-not-allowed bg-black/10 text-black/35"
                      : "bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white hover:scale-[1.01]"
                  }`}
                >
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>
            </section>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E53935]">
                  More items
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#161616]">
                  You might also like
                </h2>
              </div>
            </div>

            {suggestionsLoading ? (
              <div className="rounded-[28px] border border-black/8 bg-white/80 p-6 text-gray-500">
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="rounded-[28px] border border-black/8 bg-white/80 p-6 text-gray-500">
                No suggestions available right now.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {suggestions.slice(0, 6).map((suggestion) => {
                  const suggestionPrice = defaultDisplayPriceForItem(suggestion);
                  const suggestionMode = pricingModeForItem(suggestion);
                  const suggestionLabel =
                    suggestionMode === "single"
                      ? "Single"
                      : packDisplayText(
                          defaultSelectedSizeForItem(suggestion),
                          suggestion,
                        );

                  return (
                    <Link
                      key={suggestion._id}
                      to={`/product/${suggestion._id}`}
                      className="overflow-hidden rounded-[26px] border border-black/8 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition hover:-translate-y-1"
                    >
                      <img
                        src={suggestion.img || "/placeholder.png"}
                        alt={suggestion.name}
                        className="h-44 w-full object-cover"
                      />
                      <div className="p-4">
                        <div className="text-lg font-black text-gray-900">
                          {suggestion.name}
                        </div>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-black/35">
                          {suggestionLabel}
                        </div>
                        <div className="mt-3 text-2xl font-black text-[#ef4444]">
                          {RUPEE}
                          {Number(suggestionPrice || 0).toFixed(0)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-[#ef4444] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          Item added to cart!
        </div>
      )}
    </>
  );
}
