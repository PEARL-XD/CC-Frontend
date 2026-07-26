import React from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/outline";

const TONE_STYLES = {
  info: {
    wrapper:
      "border-[#8ec5ff]/45 bg-gradient-to-br from-[#eff7ff] via-[#f8fbff] to-[#eef6ff]",
    badge: "bg-[#dbeeff] text-[#1d4ed8]",
    title: "text-[#10223d]",
    message: "text-slate-700",
    accent: "text-[#1d4ed8]",
    icon: InformationCircleIcon,
  },
  warning: {
    wrapper:
      "border-[#f7c97a]/55 bg-gradient-to-br from-[#fff9ed] via-[#fffdf6] to-[#fff4df]",
    badge: "bg-[#ffe8bf] text-[#9a5b00]",
    title: "text-[#412500]",
    message: "text-[#6b4c18]",
    accent: "text-[#c97b00]",
    icon: ExclamationCircleIcon,
  },
  success: {
    wrapper:
      "border-[#9be3bd]/55 bg-gradient-to-br from-[#f0fff6] via-[#fbfffc] to-[#eafaf1]",
    badge: "bg-[#dcfce7] text-[#166534]",
    title: "text-[#0f2b19]",
    message: "text-[#3c5c49]",
    accent: "text-[#15803d]",
    icon: CheckCircleIcon,
  },
  promo: {
    wrapper:
      "border-[#ffc29f]/55 bg-gradient-to-br from-[#fff4ed] via-[#fffaf7] to-[#fff0e5]",
    badge: "bg-[#ffe2d0] text-[#b54708]",
    title: "text-[#3c1d0d]",
    message: "text-[#734a33]",
    accent: "text-[#c2410c]",
    icon: SparklesIcon,
  },
};

export default function StorefrontBanner({
  enabled = false,
  title = "",
  message = "",
  tone = "info",
  className = "",
}) {
  if (!enabled || !String(message).trim()) return null;

  const style = TONE_STYLES[String(tone).toLowerCase()] || TONE_STYLES.info;
  const Icon = style.icon;

  return (
    <section
      className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      <div
        className={`overflow-hidden rounded-[28px] border shadow-[0_16px_50px_rgba(0,0,0,0.08)] ${style.wrapper}`}
      >
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/75 shadow-sm">
              <Icon className={`h-6 w-6 ${style.accent}`} />
            </div>

            <div className="min-w-0">
              <div
                className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.26em] ${style.badge}`}
              >
                Live update
              </div>
              <h2
                className={`mt-3 text-xl font-black leading-tight sm:text-2xl ${style.title}`}
              >
                {title || "A quick update from CleanChops"}
              </h2>
              <p className={`mt-2 text-sm leading-6 sm:text-[15px] ${style.message}`}>
                {message}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm sm:max-w-[220px]">
            <span
              className={`block text-[11px] font-extrabold uppercase tracking-[0.22em] ${style.accent}`}
            >
              Notice
            </span>
            <span className="mt-1 block leading-6">
              We keep the website synced with the latest backend updates.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
