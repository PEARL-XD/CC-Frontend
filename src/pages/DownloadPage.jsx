import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  DeviceMobileIcon,
  DownloadIcon,
  ExternalLinkIcon,
  QrcodeIcon,
  SparklesIcon,
} from "@heroicons/react/outline";
import Logo from "../components/Logo";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.cleanchops.app";
const APP_STORE_URL = "https://apps.apple.com/app/id6773819709";
const CANONICAL_DOWNLOAD_URL = "https://cleanchops.in/download";

export default function DownloadPage() {
  useEffect(() => {
    const prevTitle = document.title;
    const descriptionTag = document.querySelector(
      'meta[name="description"]',
    );
    const prevDescription = descriptionTag?.getAttribute("content");

    document.title = "CleanChops | Get the App";

    if (descriptionTag) {
      descriptionTag.setAttribute(
        "content",
        "Download CleanChops on Android or iPhone, or continue on the web.",
      );
    }

    return () => {
      document.title = prevTitle;
      if (descriptionTag && prevDescription !== null) {
        descriptionTag.setAttribute("content", prevDescription);
      }
    };
  }, []);

  const pageUrl = useMemo(() => {
    return CANONICAL_DOWNLOAD_URL;
  }, []);

  const qrUrl = useMemo(() => {
    if (!pageUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=${encodeURIComponent(
      pageUrl,
    )}`;
  }, [pageUrl]);

  const openStore = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white overflow-hidden">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.10),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(229,57,53,0.28),_transparent_32%),linear-gradient(135deg,_#FFF6E5_0%,_#FFD6A5_38%,_#FF8C42_100%)] opacity-95" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12 sm:h-14 sm:w-14" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-black/45 font-semibold">
                  CleanChops
                </p>
                <p className="text-sm font-semibold text-black/80">
                  Fresh meat delivery
                </p>
              </div>
            </div>

            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-2 text-sm font-semibold text-black/80 backdrop-blur-md transition hover:bg-white/70"
            >
              Continue to web
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-black/60 backdrop-blur-md">
                <SparklesIcon className="h-4 w-4 text-[#E53935]" />
                Scan to install
              </div>

              <h1 className="mt-5 max-w-xl text-5xl font-black leading-[0.95] tracking-tight text-[#111] sm:text-6xl lg:text-7xl">
                Download CleanChops
                <span className="block text-[#E53935]">in one scan.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-black/70 sm:text-lg">
                Open the app store for your device, or keep browsing on the web.
                This page is made for QR campaigns so people can jump into
                CleanChops fast from anywhere in your society.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <FeatureCard
                  icon={<DeviceMobileIcon className="h-5 w-5" />}
                  title="Android"
                  text="Google Play Store"
                />
                <FeatureCard
                  icon={<DownloadIcon className="h-5 w-5" />}
                  title="iPhone"
                  text="App Store"
                />
                <FeatureCard
                  icon={<ExternalLinkIcon className="h-5 w-5" />}
                  title="Web"
                  text="Continue in browser"
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <StoreButton
                  onClick={() => openStore(PLAY_STORE_URL)}
                  label="Get it on Google Play"
                  helper="Android store"
                />
                <StoreButton
                  onClick={() => openStore(APP_STORE_URL)}
                  label="Download on the App Store"
                  helper="iPhone store"
                />
              </div>

              <div className="mt-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-black/90"
                >
                  Continue to web
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:justify-self-end">
              <div className="rounded-[32px] border border-white/30 bg-white/88 p-5 text-[#111] shadow-[0_25px_60px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-[#FFF1E6] p-3 text-[#E53935]">
                    <QrcodeIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-black/45">
                      QR code
                    </p>
                    <h2 className="text-xl font-black">Ready to print</h2>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-black/65">
                  This QR points to the live download page on cleanchops.in.
                  Open this page on a laptop, take a screenshot of the code,
                  and print it for your society ads.
                </p>

                <div className="mt-5 rounded-[26px] bg-[#0d0d0d] p-4">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="CleanChops download QR"
                      className="mx-auto aspect-square w-full max-w-[360px] rounded-2xl bg-white p-3"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-2xl bg-white/90 text-sm font-semibold text-black/60">
                      QR preview unavailable
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-[#FFF6E5] px-4 py-3 text-sm text-black/70">
                  Live URL: <span className="font-bold text-black">{pageUrl}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <BottomCard
              title="Fast install"
              text="Send customers straight to the right store based on their device."
            />
            <BottomCard
              title="One link for ads"
              text="Stick the QR on posters, flyers, society gates, and notice boards."
            />
            <BottomCard
              title="Continue browsing"
              text="If they are not ready to install yet, they can continue on the website."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white/55 p-4 backdrop-blur-md">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF1E6] text-[#E53935]">
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-sm font-extrabold text-black">{title}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
          {text}
        </p>
      </div>
    </div>
  );
}

function StoreButton({ label, helper, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-w-[240px] flex-1 items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#111] px-5 py-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#1a1a1a]"
    >
      <div>
        <span className="block text-[11px] uppercase tracking-[0.26em] text-white/45">
          {helper}
        </span>
        <span className="mt-1 block text-sm font-bold">{label}</span>
      </div>
      <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-[#FFB38A]" />
    </button>
  );
}

function BottomCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/12 p-5 backdrop-blur-md">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/70">{text}</p>
    </div>
  );
}
