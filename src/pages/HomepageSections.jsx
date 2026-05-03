import React from "react";

// ─── WHY CLEANCHOPS ───────────────────────────────────────────────────────────
const reasons = [
  { num: "01", title: "Hygiene-first processing", desc: "Controlled environment, no open-market handling. What you order is exactly what arrives." },
  { num: "02", title: "Standardised cuts, every time", desc: "Curry cut, drumsticks, wings — precise, consistent, no surprises in the packet." },
  { num: "03", title: "Order in minutes, track live", desc: "Digital ordering + real-time delivery tracking. No calls, no queues, no guesswork." },
  { num: "04", title: "Zero middlemen", desc: "We cut, pack, and deliver. Fresher product, fairer price, full accountability." },
];

export function WhatToExpect() {
  return (
    <section
      className="w-full cursor-default"
      style={{ background: "#080808", borderTop: "6px solid #080808", borderBottom: "6px solid rgb(106 30 30)" }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div
          className="relative flex flex-col justify-end px-12 py-16 overflow-hidden"
          style={{ background: "#E53935", minHeight: "420px" }}
        >
          <div className="absolute pointer-events-none" style={{ top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", border: "40px solid rgba(255,255,255,0.07)" }} />
          <div className="absolute pointer-events-none" style={{ bottom: "-60px", left: "-30px", width: "160px", height: "160px", borderRadius: "50%", border: "30px solid rgba(0,0,0,0.1)" }} />
          <p className="relative z-10 tracking-[4px] uppercase mb-4" style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
            The CleanChops difference
          </p>
          <h2 className="relative z-10 font-black leading-[1.05] text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(36px,4.5vw,56px)" }}>
            Not just<br />meat.<br />
            <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.6)" }}>A standard.</span>
          </h2>
          <p className="relative z-10 leading-relaxed mt-5 max-w-[300px]" style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)" }}>
            We're replacing the unhygienic butcher experience with something you can actually trust — clean, consistent, delivered.
          </p>
        </div>

        <div className="flex flex-col justify-center px-10 py-10" style={{ background: "#0d0d0d" }}>
          {reasons.map((r, i) => (
            <div key={r.num} className="flex items-start gap-5 py-5" style={{ borderBottom: i < reasons.length - 1 ? "1px solid #1f1f1f" : "none" }}>
              <span className="flex-shrink-0 w-9 leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "30px", fontWeight: 900, color: "#2a2a2a" }}>
                {r.num}
              </span>
              <span className="flex-shrink-0 w-2 h-2 rounded-full mt-[9px]" style={{ background: "#E53935" }} />
              <div>
                <div className="font-semibold text-white mb-1" style={{ fontSize: "15px" }}>{r.title}</div>
                <div className="leading-relaxed" style={{ fontSize: "13.5px", color: "#555" }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── APP DOWNLOAD BANNER ──────────────────────────────────────────────────────
export function AppDownloadBanner() {
  return (
    <section
      className="w-full relative overflow-hidden px-6 py-16 cursor-default"
      style={{ background: "#0a0a0a", borderTop: "6px solid #080808" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(80px,18vw,180px)", fontWeight: 900, color: "rgba(255,255,255,0.025)", letterSpacing: "-8px", whiteSpace: "nowrap" }}
        aria-hidden="true"
      >
        CleanChops
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-6" style={{ background: "#181818", border: "1px solid #2a2a2a" }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#E53935" }}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="white"><polygon points="2,1 9,5 2,9" /></svg>
          </span>
          <span className="font-medium" style={{ fontSize: "12px", color: "#888" }}>Available now on all devices</span>
        </div>

        <h2 className="font-black leading-[1.1] text-white mb-5" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px,4.5vw,48px)" }}>
          Fresh meat,<br />
          <span style={{ color: "#E53935" }}>your phone,</span><br />
          three taps.
        </h2>

        <p className="leading-[1.85] mb-6 max-w-[460px]" style={{ fontSize: "15px", color: "#555" }}>
          Browse cuts, pick your size, checkout — the CleanChops app makes it fast, clean, and completely hassle-free. Track your delivery in real time, straight to your door.
        </p>

        <div className="inline-flex items-center gap-2 rounded-[10px] px-4 py-2 mb-8" style={{ background: "#0f1a0f", border: "1px solid #1a3a1a" }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
          <span className="font-medium" style={{ fontSize: "13px", color: "#4ade80" }}>
            Delivered fresh in 60–90 minutes, guaranteed
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { label: "Download on the", name: "App Store", icon: <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" /> },
            { label: "Get it on", name: "Google Play", icon: <path d="M3.18 23.76c.28.15.6.19.9.12l11.37-6.57-2.41-2.39-9.86 8.84zm-1.51-20.1C1.4 3.98 1.29 4.35 1.29 4.8v14.4c0 .45.11.82.38 1.14l.06.06 8.07-8.07v-.19L1.73 3.6l-.06.06zM19.74 10.33l-2.29-1.33-2.68 2.68 2.68 2.68 2.31-1.33c.66-.38.66-1.32-.02-1.7zM4.08.24L15.45 6.81 13.04 9.22 3.18.38C3.5.27 3.84.08 4.08.24z" /> },
          ].map((btn) => (
            <StoreButton key={btn.name} label={btn.label} name={btn.name} icon={btn.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoreButton({ label, name, icon }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      className="flex items-center gap-3 rounded-xl px-5 py-3 transition-colors cursor-pointer"
      style={{ background: hovered ? "#1a0f0f" : "#141414", border: `1px solid ${hovered ? "#E53935" : "#222"}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">{icon}</svg>
      <div className="text-left">
        <span className="block" style={{ fontSize: "11px", color: "#444" }}>{label}</span>
        <span className="block font-semibold text-white" style={{ fontSize: "14px" }}>{name}</span>
      </div>
    </button>
  );
}

import { Link } from "react-router-dom";

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const quickLinks = [
  { label: "Home",        path: "/home" },
  { label: "Raw Chicken", path: "/home" },
  { label: "Cooked Range",path: "/home" },
  { label: "My Orders",   path: "/orderspage" },
  { label: "Cart",        path: "/cart" },
];

const companyLinks = [
  { label: "About Us",         path: "/info" },
  { label: "Delivery Policy",  path: "/info#delivery" },
  { label: "Privacy Policy",   path: "/info#privacy" },
  { label: "Terms of Use",     path: "/info#terms" },
  { label: "Contact",          path: "/support" },
];

export function Footer() {
  return (
    <footer className="w-full bg-[#111] text-[#aaa] text-[13px] cursor-default">
      <div className="border-b border-[#222] py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="text-[22px] font-extrabold text-white mb-1">
              Clean<span className="text-[#E53935]">Chops</span>
            </div>
            <p className="text-[12.5px] text-[#555] leading-relaxed mb-4 max-w-[220px]">
              Fresh, hygienic chicken delivered to your door. No open markets. No compromises.
            </p>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-[2px] uppercase text-[#555] mb-4">Quick links</div>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="text-[#888] hover:text-white transition-colors text-[13px] cursor-pointer">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-[2px] uppercase text-[#555] mb-4">Company</div>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map(({ label, path }) => (
                <li key={label}>
                  <Link to={path} className="text-[#888] hover:text-white transition-colors text-[13px] cursor-pointer">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="py-4 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] text-[#444]">
            © {new Date().getFullYear()} <span className="text-[#E53935]">CleanChops</span>. All rights reserved.
          </span>
          <div className="flex gap-2">
            {["100% Hygienic", "Secure Payments"].map((b) => (
              <span key={b} className="text-[10.5px] text-[#444] border border-[#2a2a2a] px-2.5 py-0.5 rounded-full">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}