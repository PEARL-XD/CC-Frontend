import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  SparklesIcon,
} from "@heroicons/react/outline";
import LogoImage from "../assets/images/logo.png";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.cleanchops.app";
const APP_STORE_URL = "https://apps.apple.com/in/app/clean-chops/id6773819709";
const CANONICAL_DOWNLOAD_URL = "https://cleanchops.in/download";
export default function DownloadPage() {
  useEffect(() => {
    const prevTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const prevDescription = descriptionTag?.getAttribute("content");

    document.title = "CleanChops";

    if (descriptionTag) {
      descriptionTag.setAttribute(
        "content",
        "Download CleanChops to get fresh chicken delivery, fast checkout, and no hidden charges.",
      );
    }

    return () => {
      document.title = prevTitle;
      if (descriptionTag && prevDescription !== null) {
        descriptionTag.setAttribute("content", prevDescription);
      }
    };
  }, []);

  const openStore = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffaf6] text-[#161616]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(229,57,53,0.14),_transparent_30%),radial-gradient(circle_at_80%_15%,_rgba(255,140,66,0.26),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(0,0,0,0.06),_transparent_28%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(255,247,240,0.94)_40%,rgba(255,236,221,0.98)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.16]" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="rounded-[36px] border border-white/70 bg-white/75 p-6 shadow-[0_28px_70px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E53935]/12 bg-[#E53935]/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7f1d1d]">
              <SparklesIcon className="h-4 w-4 text-[#E53935]" />
              Fresh meat. Faster checkout.
            </div>

            <div className="mt-6 max-w-[480px]">
              <img
                src={LogoImage}
                alt="CleanChops"
                className="h-auto w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.14)]"
              />
            </div>

            <h1 className="mt-8 max-w-2xl text-4xl font-black leading-[0.95] tracking-tight text-[#121212] sm:text-5xl lg:text-6xl">
              One scan. One tap.
              <span className="block text-[#E53935]">Straight to CleanChops.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-8 text-black/70 sm:text-lg">
              Fresh, hygienic chicken delivered fast with clear pricing and no
              hidden surprises. Choose the app store for your phone or continue
              on the web right away.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ActionButton
                onClick={() => openStore(PLAY_STORE_URL)}
                label="Google Play"
                helper="Android"
                icon={<DownloadIcon className="h-5 w-5" />}
                tone="brand"
              />
              <ActionButton
                onClick={() => openStore(APP_STORE_URL)}
                label="App Store"
                helper="iPhone"
                icon={<DownloadIcon className="h-5 w-5" />}
              />
              <Link
                to="/"
                className="inline-flex min-w-[180px] items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4 text-left text-sm font-semibold text-[#161616] shadow-sm transition hover:-translate-y-0.5 hover:border-[#E53935]/25 hover:shadow-md"
              >
                <div>
                  <span className="block text-[11px] uppercase tracking-[0.26em] text-black/40">
                    Web
                  </span>
                  <span className="mt-1 block text-sm font-bold">
                    Continue on web
                  </span>
                </div>
                <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-[#E53935]" />
              </Link>
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-[#fff8f2] px-4 py-3 text-sm text-black/65">
              <ExternalLinkIcon className="h-4 w-4 text-[#E53935]" />
              <span className="font-semibold text-black/80">Fresh, reliable, simple.</span>
              <span className="hidden sm:inline">Built for quick ordering from mobile or web.</span>
            </div>
          </div>

          <div className="flex items-center lg:justify-end">
            <div className="w-full max-w-[560px] rounded-[36px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#E53935]">
                  Why customers choose CleanChops
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#151515]">
                  Better food, better experience
                </h2>
              </div>

              <div className="mt-6 grid gap-3">
                <BenefitCard
                  title="Fresh, not frozen"
                  text="Prepared and delivered with hygiene-first handling."
                />
                <BenefitCard
                  title="Fast delivery"
                  text="Order in a few taps and get it when you need it."
                />
                <BenefitCard
                  title="No hidden charges"
                  text="Clear pricing before checkout, with simple payment flow."
                />
              </div>

              <div className="mt-6 rounded-[24px] border border-black/8 bg-[#fff8f5] px-4 py-4">
                <p className="text-sm leading-7 text-black/72">
                  Download the app to browse items, place orders quickly, and
                  track everything from one place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ActionButton({ label, helper, onClick, icon, tone = "light" }) {
  const isBrand = tone === "brand";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-[200px] flex-1 items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isBrand
          ? "border-[#ffb28f]/70 bg-gradient-to-r from-[#ffb28f] via-[#ff8c42] to-[#e53935] text-white"
          : "border-black/10 bg-white text-[#161616]"
      }`}
    >
      <div>
        <span
          className={`block text-[11px] uppercase tracking-[0.26em] ${
            isBrand ? "text-white/70" : "text-black/38"
          }`}
        >
          {helper}
        </span>
        <span className="mt-1 block text-sm font-bold">{label}</span>
      </div>
      <span className={isBrand ? "text-white" : "text-[#E53935]"}>{icon}</span>
    </button>
  );
}

function BenefitCard({ title, text }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fffaf8] px-4 py-4">
      <p className="text-sm font-black text-[#161616]">{title}</p>
      <p className="mt-1 text-sm leading-6 text-black/64">{text}</p>
    </div>
  );
}
