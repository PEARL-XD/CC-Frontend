import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  DownloadIcon,
  ExternalLinkIcon,
  QrcodeIcon,
  SparklesIcon,
} from "@heroicons/react/outline";
import LogoImage from "../assets/images/logo.png";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.cleanchops.app";
const APP_STORE_URL = "https://apps.apple.com/in/app/clean-chops/id6773819709";
const CANONICAL_DOWNLOAD_URL = "https://cleanchops.in/download";
const QR_IMAGE_URL = "/download-qr.png";

export default function DownloadPage() {
  useEffect(() => {
    const prevTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const prevDescription = descriptionTag?.getAttribute("content");

    document.title = "CleanChops";

    if (descriptionTag) {
      descriptionTag.setAttribute(
        "content",
        "Scan the CleanChops QR to open the app on Android, iPhone, or web.",
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
              QR landing page
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
              Use this link on posters, society boards, flyers, and WhatsApp
              shares. People can jump to the right store or continue on the web
              without any extra steps.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ActionButton
                onClick={() => openStore(PLAY_STORE_URL)}
                label="Google Play"
                helper="Android"
                icon={<DownloadIcon className="h-5 w-5" />}
                dark
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
              <span className="font-semibold text-black/80">cleanchops.in/download</span>
              <span className="hidden sm:inline">works as the single share link</span>
            </div>
          </div>

          <div className="flex items-center lg:justify-end">
            <div className="w-full max-w-[560px] rounded-[36px] border border-white/80 bg-white/88 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#E53935]">
                    Scan here
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#151515]">
                    Open the download page
                  </h2>
                </div>
                <div className="rounded-2xl bg-[#FFF1E8] p-3 text-[#E53935] shadow-sm">
                  <QrcodeIcon className="h-7 w-7" />
                </div>
              </div>

              <div className="mt-6 rounded-[30px] bg-[#111111] p-4 shadow-inner">
                <div className="rounded-[24px] bg-white p-4">
                  <img
                    src={QR_IMAGE_URL}
                    alt="CleanChops download QR code"
                    className="mx-auto aspect-square w-full max-w-[360px]"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <MiniPill label="Android" value="Google Play" />
                <MiniPill label="iPhone" value="App Store" />
              </div>

              <div className="mt-5 rounded-[24px] border border-[#E53935]/10 bg-[#FFF7F3] px-4 py-4">
                <p className="text-sm leading-7 text-black/72">
                  If someone scans this with a phone browser, they land on the
                  download page first and can choose the app store that fits
                  their device.
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.26em] text-black/45">
                  {CANONICAL_DOWNLOAD_URL}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ActionButton({ label, helper, onClick, icon, dark = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-w-[200px] flex-1 items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        dark
          ? "border-[#171717] bg-[#171717] text-white"
          : "border-black/10 bg-white text-[#161616]"
      }`}
    >
      <div>
        <span
          className={`block text-[11px] uppercase tracking-[0.26em] ${
            dark ? "text-white/45" : "text-black/38"
          }`}
        >
          {helper}
        </span>
        <span className="mt-1 block text-sm font-bold">{label}</span>
      </div>
      <span className={dark ? "text-[#FFB38A]" : "text-[#E53935]"}>{icon}</span>
    </button>
  );
}

function MiniPill({ label, value }) {
  return (
    <div className="rounded-[22px] border border-black/8 bg-[#fffaf8] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/38">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-[#161616]">{value}</p>
    </div>
  );
}
