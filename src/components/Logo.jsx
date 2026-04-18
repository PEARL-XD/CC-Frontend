// src/components/Logo.jsx
import React from "react";

export default function Logo({ className = "w-14 h-14" }) {
  // Colors: primary (meat red) and soft-beige accent
  const primary = "#E53935";
  const accent = "#F6D7C1";

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-labelledby="cleanChopsLogo"
      role="img"
    >
      <title id="cleanChopsLogo">Clean-Chops logo</title>

      {/* background circle */}
      <circle cx="40" cy="40" r="36" fill={accent} />

      {/* stylized chicken head */}
      <path
        d="M26 42 C26 33, 38 30, 46 33 C54 36, 54 48, 46 52 C38 56, 28 50, 26 42 Z"
        fill={primary}
      />

      {/* beak */}
      <path d="M46 40 L52 38 L52 42 Z" fill="#FFD166" />

      {/* small eye */}
      <circle cx="37" cy="40" r="1.6" fill="#fff" />

      {/* small knife icon overlay (top-right) */}
      <g transform="translate(52,18) rotate(-15)">
        <rect x="0" y="6" width="18" height="4" rx="1" fill="#fff" opacity="0.9" />
        <rect x="4" y="2" width="10" height="4" rx="1" fill="#cfcfcf" />
      </g>
    </svg>
  );
}
