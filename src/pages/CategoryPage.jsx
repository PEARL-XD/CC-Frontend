import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { useCart } from "../contexts/CartContext";
import StorefrontBanner from "../components/StorefrontBanner";
import {
  defaultDisplayPriceForItem,
  defaultSelectedSizeForItem,
  getPackPriceForItem,
  packDisplayText,
} from "../utils/packPricing";
import {
  categorySlug,
  getCategoryMeta,
  sortSectionsByPriority,
} from "../utils/categoryMeta";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function CategoryPage() {
  const { categorySlug: routeSlug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState("");
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [banner, setBanner] = useState({
    enabled: false,
    title: "",
    message: "",
    tone: "info",
  });
  const pendingAddsRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [itemsRes, storefrontRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/items`),
          fetch(`${API_BASE_URL}/api/storefront`),
        ]);

        if (!mounted) return;

        if (itemsRes.status === "fulfilled") {
          const data = await itemsRes.value.json();
          setSections(sortSectionsByPriority(Array.isArray(data) ? data : []));
        } else {
          throw itemsRes.reason;
        }

        if (storefrontRes.status === "fulfilled") {
          const data = await storefrontRes.value.json();
          const settings = data?.settings;
          if (settings && typeof settings === "object") {
            setBanner({
              enabled: settings.bannerEnabled === true,
              title: String(settings.bannerTitle || ""),
              message: String(settings.bannerMessage || ""),
              tone: String(settings.bannerTone || "info"),
            });
          }
        }
      } catch (err) {
        console.error("Failed to load category items:", err);
        if (mounted) setError("Could not load this category right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const currentSection = useMemo(() => {
    return (
      sections.find((section) => categorySlug(section.title) === routeSlug) ||
      null
    );
  }, [sections, routeSlug]);

  const currentMeta = getCategoryMeta(currentSection?.title || routeSlug);
  const heroCandidates = useMemo(() => {
    return [...new Set([
      currentSection?.image,
      currentMeta.image,
      _firstImageUrl(currentSection?.articles),
    ].filter(Boolean))];
  }, [currentSection?.image, currentMeta.image, currentSection?.articles]);

  const categoryLinks = useMemo(() => {
    return sections.map((section) => ({
      title: section.title,
      slug: categorySlug(section.title),
      meta: getCategoryMeta(section.title),
      active: categorySlug(section.title) === routeSlug,
    }));
  }, [sections, routeSlug]);

  const addToCartHandler = (item) => {
    if (!item) return;

    const isOutOfStock = item.isOutOfStock === true;
    const isUnavailable =
      item.isUnavailable === true ||
      item.isCategoryDisabled === true ||
      isOutOfStock ||
      currentSection?.isDisabled === true;

    if (isUnavailable) return;

    const selectedSize = defaultSelectedSizeForItem(item);
    const key = `${item._id || item.id}-${selectedSize}`;
    if (pendingAddsRef.current.has(key)) return;

    pendingAddsRef.current.add(key);

    try {
      addItem({
        _id: item._id || item.id,
        name: item.name || item.title || "Item",
        price: getPackPriceForItem(item, selectedSize),
        selectedSize,
        quantity: 1,
        img: item.img || item.image || "",
        category: item.category || currentSection?.title || "",
      });
    } catch (err) {
      console.error("addItem failed:", err);
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
    setTimeout(() => {
      pendingAddsRef.current.delete(key);
    }, 800);
  };

  const heroImage =
    heroCandidates[heroImageIndex] || "";

  useEffect(() => {
    setHeroImageIndex(0);
  }, [routeSlug, currentSection?.image, currentMeta.image]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse rounded-[32px] border border-black/8 bg-white/80 p-6">
          <div className="h-6 w-36 rounded-full bg-black/6" />
          <div className="mt-4 h-12 w-2/3 rounded bg-black/6" />
          <div className="mt-3 h-5 w-1/2 rounded bg-black/5" />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[340px] rounded-[28px] bg-black/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentSection) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-black/8 bg-white p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#E53935]">
            Category not found
          </p>
          <h1 className="mt-3 text-3xl font-black text-[#161616]">
            {error || "We couldn't find this menu right now."}
          </h1>
          <p className="mt-3 text-base leading-8 text-black/65">
            Try going back to the category hub and pick another menu.
          </p>
          <Link
            to="/home"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#fb923c] to-[#ef4444] px-5 py-3 text-sm font-bold text-white shadow-lg"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to categories
          </Link>
        </div>
      </div>
    );
  }

  const itemCount = currentSection.articles?.length || 0;
  const [start, mid, end] = currentMeta.fallback;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[linear-gradient(180deg,#fffaf6_0%,#fff4eb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-sm font-semibold text-[#161616] shadow-sm transition hover:-translate-y-0.5"
          >
            <ArrowLeftIcon className="h-4 w-4 text-[#E53935]" />
            Back to categories
          </Link>

          <div className="flex flex-wrap gap-2">
            {categoryLinks.map((link) => (
              <button
                key={link.slug}
                type="button"
                onClick={() => navigate(`/category/${link.slug}`)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] transition ${
                  link.active
                    ? "bg-[#161616] text-white shadow-sm"
                    : "border border-black/8 bg-white text-black/55 hover:border-[#E53935]/25 hover:text-[#E53935]"
                }`}
              >
                {link.meta.label}
              </button>
            ))}
          </div>
        </div>

        <StorefrontBanner
          className="mb-4"
          enabled={banner.enabled}
          title={banner.title}
          message={banner.message}
          tone={banner.tone}
        />

        <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/82 shadow-[0_24px_70px_rgba(0,0,0,0.09)] backdrop-blur-xl">
          <div
            className="grid min-h-[360px] gap-0 lg:grid-cols-[1.05fr_0.95fr]"
            style={{
              background: heroImage
                ? undefined
                : `linear-gradient(135deg, ${start} 0%, ${mid} 52%, ${end} 100%)`,
            }}
          >
            <div className="relative flex items-end overflow-hidden">
              {heroImage && (
                <img
                  src={heroImage}
                  alt={currentMeta.label}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => {
                    setHeroImageIndex((index) =>
                      Math.min(index + 1, Math.max(heroCandidates.length - 1, 0)),
                    );
                  }}
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.42)_100%)]" />

              <div className="relative z-10 p-6 sm:p-8 lg:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/80">
                  {currentMeta.label}
                </p>
                <h1 className="mt-3 max-w-2xl text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {currentSection.title}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-8 text-white/82 sm:text-lg">
                  {currentMeta.summary}
                </p>
              </div>
            </div>

            <div className="flex items-stretch bg-white p-6 sm:p-8 lg:p-10">
              <div className="flex w-full flex-col justify-between rounded-[28px] border border-black/8 bg-[#fffaf8] p-5 sm:p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E53935]">
                    Category overview
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-[#161616]">
                    {itemCount} item{itemCount === 1 ? "" : "s"} available
                  </h2>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MiniStat
                    label="Status"
                    value={currentSection.isDisabled ? "Coming soon" : "Available"}
                  />
                  <MiniStat label="Focus" value={currentMeta.label} />
                </div>

                <div className="mt-5 rounded-[24px] border border-[#E53935]/10 bg-white px-4 py-4">
                  <p className="text-sm leading-7 text-black/68">
                    {currentSection.isDisabled
                      ? "This category is temporarily closed. Browse the other sections or come back when it reopens."
                      : "Choose an item, view its details, and add it to cart in one flow."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E53935]">
                Items
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#161616]">
                Explore {currentMeta.label}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {currentSection.articles?.map((item, index) => {
              const isOutOfStock = item.isOutOfStock === true;
              const isUnavailable =
                item.isUnavailable === true ||
                item.isCategoryDisabled === true ||
                isOutOfStock ||
                currentSection.isDisabled === true;
              const key = `${item._id || item.id}-${defaultSelectedSizeForItem(item)}`;
              const isPending = pendingAddsRef.current.has(key);
              const displayPrice = defaultDisplayPriceForItem(item);
              const sizeLabel = packDisplayText(defaultSelectedSizeForItem(item), item);

              return (
                <article
                  key={item._id || item.id || index}
                  className={`overflow-hidden rounded-[28px] border border-black/8 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] ${
                    isUnavailable ? "opacity-70 grayscale" : ""
                  }`}
                >
                  <div className="relative">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="h-48 w-full object-cover"
                    />

                    {isUnavailable && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#E53935] shadow">
                          {isOutOfStock ? "Out of stock" : "Coming soon"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 p-4 sm:p-5">
                    <div>
                      <h3 className="text-lg font-black text-[#161616]">
                        {item.name}
                      </h3>
                      {item.desc && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-black/55">
                          {item.desc}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-2xl font-black text-[#E53935]">
                          ₹{Number(displayPrice || 0).toFixed(0)}
                        </div>
                        <div className="text-xs uppercase tracking-[0.22em] text-black/35">
                          {sizeLabel}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/product/${item._id || item.id}`)}
                        disabled={isUnavailable}
                        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                          isUnavailable
                            ? "cursor-not-allowed border-black/8 bg-black/4 text-black/30"
                            : "border-black/8 bg-white text-[#161616] hover:border-[#E53935]/25 hover:text-[#E53935]"
                        }`}
                      >
                        Customize
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCartHandler(item)}
                      disabled={isUnavailable || isPending}
                      className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                        isUnavailable || isPending
                          ? "cursor-not-allowed bg-black/8 text-black/35"
                          : "bg-gradient-to-r from-[#fb923c] to-[#ef4444] text-white shadow-md hover:shadow-lg"
                      }`}
                    >
                      {isPending
                        ? "Adding..."
                        : isUnavailable
                        ? "Unavailable"
                        : "Add to cart"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-full bg-[#161616] px-5 py-3 text-sm font-semibold text-white shadow-lg">
          Item added to cart
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[18px] border border-black/8 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-black/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#161616]">{value}</p>
    </div>
  );
}

function _firstImageUrl(articles) {
  if (!Array.isArray(articles)) return "";
  for (const article of articles) {
    const url = String(article?.img || article?.image || "").trim();
    if (url) return url;
  }
  return "";
}
