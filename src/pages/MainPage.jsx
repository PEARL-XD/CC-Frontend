import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/outline";
import { getCategoryMeta, sortSectionsByPriority } from "../utils/categoryMeta";
import StorefrontBanner from "../components/StorefrontBanner";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const FAQ_GROUPS = [
  {
    id: "ordering",
    title: "Ordering",
    emoji: "🛒",
    count: 4,
    items: [
      {
        question: "How do I place an order?",
        answer:
          "Browse our products, add your favorites to the cart, and complete checkout in just a few taps.",
      },
      {
        question: "Can I modify my order?",
        answer:
          "You can modify your order only before it starts being prepared. Contact support as soon as possible.",
      },
      {
        question: "Can I cancel my order?",
        answer:
          "Yes, orders can be cancelled before preparation begins. Once processing or delivery has started, cancellation may not be possible.",
      },
      {
        question: "Is there a minimum order value?",
        answer:
          "No minimum order is required unless mentioned during checkout.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery",
    emoji: "🚚",
    count: 3,
    items: [
      {
        question: "How long does delivery take?",
        answer:
          "Most orders are delivered within 60-90 minutes, and in the worst case it may take up to 120 minutes depending on your location and order volume.",
      },
      {
        question: "Where do you deliver?",
        answer:
          "We currently deliver only to selected serviceable locations. Enter your address to check availability.",
      },
      {
        question: "Can I schedule my order?",
        answer:
          "Yes, if scheduled delivery is available in your area, you can choose a preferred delivery slot during checkout.",
      },
    ],
  },
  {
    id: "freshness",
    title: "Products & Freshness",
    emoji: "🐔",
    count: 4,
    items: [
      {
        question: "Is your chicken fresh or frozen?",
        answer: "Our chicken is fresh, never frozen.",
      },
      {
        question: "Is the chicken cleaned?",
        answer:
          "Yes. Every order is hygienically cleaned and packed before delivery.",
      },
      {
        question: "How is the chicken packed?",
        answer:
          "We use hygienic, food-grade packaging to maintain freshness during delivery.",
      },
      {
        question: "Do you use preservatives?",
        answer:
          "No. Our fresh chicken contains no added artificial preservatives.",
      },
    ],
  },
  {
    id: "rtc",
    title: "Ready-to-Cook & Cooked",
    emoji: "🍗",
    count: 3,
    items: [
      {
        question: "What's the difference between Fresh, Ready-to-Cook, and Cooked?",
        answer:
          "Fresh means raw chicken cuts. Ready-to-Cook means marinated or pre-prepared items. Cooked means fully cooked meals ready to eat.",
      },
      {
        question: "Are cooked meals prepared fresh?",
        answer:
          "Yes, our cooked meals are prepared fresh in small batches.",
      },
      {
        question: "Can I order fresh chicken and cooked food together?",
        answer:
          "Yes, you can add products from different categories in the same order.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    emoji: "💳",
    count: 2,
    items: [
      {
        question: "Which payment methods do you accept?",
        answer:
          "We accept UPI, debit and credit cards, net banking, wallets, and cash on delivery where available.",
      },
      {
        question: "Is Cash on Delivery available?",
        answer: "Yes, COD is available for eligible orders and locations.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & App",
    emoji: "📱",
    count: 2,
    items: [
      {
        question: "I didn't receive my OTP.",
        answer:
          "Wait a few minutes and try requesting another OTP. If the issue continues, contact our support team.",
      },
      {
        question: "Do I need an account to order?",
        answer:
          "Yes, creating an account helps you track orders, save addresses, and receive updates.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    emoji: "💰",
    count: 1,
    items: [
      {
        question: "Why do prices change?",
        answer:
          "Chicken prices are based on daily market rates, so prices may vary from time to time.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    emoji: "🛟",
    count: 3,
    items: [
      {
        question: "I received the wrong item.",
        answer:
          "Contact us immediately through the app with your order details, and we'll resolve the issue as quickly as possible.",
      },
      {
        question: "My package was damaged.",
        answer:
          "Please don't consume the product. Share a photo with our support team, and we'll assist you.",
      },
      {
        question: "How can I contact CleanChops?",
        answer:
          "You can reach us via in-app Support, WhatsApp, phone, or email.",
      },
    ],
  },
];

export default function MainPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaqGroup, setOpenFaqGroup] = useState("ordering");
  const [banner, setBanner] = useState({
    enabled: false,
    title: "",
    message: "",
    tone: "info",
  });

  useEffect(() => {
    let mounted = true;

    async function loadHome() {
      try {
        const [itemsRes, storefrontRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/items`),
          fetch(`${API_BASE_URL}/api/storefront`),
        ]);

        if (!mounted) return;

        if (itemsRes.status === "fulfilled") {
          const data = await itemsRes.value.json();
          const mapped = Array.isArray(data) ? data : [];
          setSections(sortSectionsByPriority(mapped));
        } else {
          console.error("Failed to load items:", itemsRes.reason);
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
          } else {
            setBanner({
              enabled: false,
              title: "",
              message: "",
              tone: "info",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load homepage:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadHome();

    return () => {
      mounted = false;
    };
  }, []);

  const categoryTiles = useMemo(() => {
    return sections.map((section) => {
      const meta = getCategoryMeta(section.title);
      return {
        ...section,
        meta,
        itemCount: Array.isArray(section.articles) ? section.articles.length : 0,
      };
    });
  }, [sections]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[linear-gradient(180deg,#fffaf6_0%,#fff3e8_100%)] pb-12">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/84 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-[#E53935]/12 bg-[#E53935]/8 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#7f1d1d] sm:text-[11px]">
              Choose a category
            </div>

            <h1 className="mt-5 text-3xl font-black leading-[0.98] tracking-tight text-[#141414] sm:text-5xl lg:text-6xl">
              Pick your menu,
              <span className="block text-[#E53935]">
                then open the section you want.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-black/68 sm:text-lg sm:leading-8">
              Each category is grouped by the backend, so cooked, uncooked, and
              ready-to-eat items stay organized as your menu grows.
            </p>
          </div>
        </section>
      </div>

      <StorefrontBanner
        className="mt-1"
        enabled={banner.enabled}
        title={banner.title}
        message={banner.message}
        tone={banner.tone}
      />

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(loading ? Array.from({ length: 3 }) : categoryTiles).map(
            (section, index) => {
              if (loading) {
                return <CategoryTileSkeleton key={index} />;
              }

              return (
                <CategoryTile
                  key={section.title}
                  title={section.title}
                  count={section.itemCount}
                  meta={section.meta}
                  onClick={() => navigate(`/category/${section.meta.slug}`)}
                />
              );
            },
          )}
        </div>

        <section className="mt-12">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.32em] text-[#E53935]">
              Quick answers
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#161616] sm:text-3xl">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-sm leading-7 text-black/60 sm:text-[15px] sm:leading-8">
              Helpful answers for ordering, delivery, pricing, and support.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {FAQ_GROUPS.map((group) => (
              <div
                key={group.id}
                className="overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_14px_36px_rgba(0,0,0,0.06)]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenFaqGroup((current) =>
                      current === group.id ? "" : group.id,
                    )
                  }
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
                  aria-expanded={openFaqGroup === group.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff2ec] text-xl">
                      {group.emoji}
                    </span>
                    <div>
                      <div className="text-base font-extrabold text-[#161616] sm:text-lg">
                        {group.title}
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-black/40">
                        {group.count} item{group.count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-[#E53935] transition-transform duration-200 ${
                      openFaqGroup === group.id ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <ArrowRightIcon className="h-5 w-5 rotate-90" />
                  </span>
                </button>

                {openFaqGroup === group.id && (
                  <div className="border-t border-black/6 px-4 pb-4 sm:px-5 sm:pb-5">
                    <div className="space-y-4 pt-4">
                      {group.items.map((item) => (
                        <div
                          key={item.question}
                          className="rounded-2xl border border-black/6 bg-[#fffaf8] p-4"
                        >
                          <h3 className="text-sm font-extrabold leading-6 text-[#111] sm:text-[15px]">
                            {item.question}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-black/58">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function CategoryTile({ title, count, meta, onClick }) {
  const image = meta.image;
  const [start, mid, end] = meta.fallback;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-[28px] border border-black/8 bg-white text-left shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
    >
      <div className="relative h-[230px] overflow-hidden sm:h-[260px]">
        {image ? (
          <img
            src={image}
            alt={meta.label}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-end p-5"
            style={{
              background: `radial-gradient(circle at top left, ${meta.tint}, transparent 45%), linear-gradient(135deg, ${start} 0%, ${mid} 55%, ${end} 100%)`,
            }}
          >
            <div className="max-w-[210px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
                Coming soon
              </p>
              <h3 className="mt-2 text-3xl font-black leading-[0.95] text-[#111]">
                {meta.label}
              </h3>
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.14)_100%)]" />

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-[#111] shadow-sm">
          {count} item{count === 1 ? "" : "s"}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="rounded-[22px] border border-white/25 bg-black/28 p-4 text-white backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/65 sm:text-[11px]">
              {meta.label}
            </p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black leading-none sm:text-3xl">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/78">
                  {meta.summary}
                </p>
              </div>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#E53935] shadow-lg"
                aria-hidden="true"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </span>
            </div>
          </div>
        </div>

        <div className="absolute right-4 top-4 rounded-full bg-black/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
          Open
        </div>
      </div>
    </button>
  );
}

function CategoryTileSkeleton() {
  return (
    <div className="h-[230px] animate-pulse rounded-[28px] border border-black/6 bg-white/80 shadow-[0_16px_40px_rgba(0,0,0,0.05)] sm:h-[260px]">
      <div className="flex h-full flex-col justify-between p-5">
        <div className="h-7 w-24 rounded-full bg-black/6" />
        <div className="space-y-3">
          <div className="h-8 w-40 rounded bg-black/6" />
          <div className="h-4 w-56 rounded bg-black/5" />
          <div className="h-4 w-32 rounded bg-black/5" />
        </div>
      </div>
    </div>
  );
}
