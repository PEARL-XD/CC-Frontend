import rawImage from "../assets/images/raw.png";
import cookedImage from "../assets/images/cooked.png";

const CATEGORY_PRIORITY = ["uncooked", "cooked", "ready-to-cook", "ready-to-eat"];

const CATEGORY_ALIASES = {
  rte: "ready-to-eat",
  rtc: "ready-to-cook",
  "readytocook": "ready-to-cook",
  "ready-to-cook": "ready-to-cook",
};

const CATEGORY_META = {
  uncooked: {
    label: "Uncooked",
    slug: "uncooked",
    summary: "Fresh cuts for home cooking.",
    accent: "#E53935",
    tint: "rgba(229, 57, 53, 0.12)",
    image: rawImage,
    fallback: ["#fff7f4", "#ffd9cc", "#ffb699"],
  },
  cooked: {
    label: "Cooked",
    slug: "cooked",
    summary: "Heat, serve, and enjoy faster.",
    accent: "#fb923c",
    tint: "rgba(251, 146, 60, 0.14)",
    image: cookedImage,
    fallback: ["#fff7ef", "#ffe0ba", "#ffb676"],
  },
  "ready-to-cook": {
    label: "Ready to Cook",
    slug: "ready-to-cook",
    summary: "Freshly grouped from the backend menu.",
    accent: "#0f766e",
    tint: "rgba(15, 118, 110, 0.14)",
    image: "https://storage.googleapis.com/cccooked/banners/ready%20to%20cook.png",
    fallback: ["#effdfb", "#cdeee7", "#93d9cb"],
  },
  "ready-to-eat": {
    label: "Ready to Eat",
    slug: "ready-to-eat",
    summary: "Quick meals when you want zero prep.",
    accent: "#0f766e",
    tint: "rgba(15, 118, 110, 0.14)",
    image: null,
    fallback: ["#effdfb", "#cdeee7", "#93d9cb"],
  },
};

function prettifyCategory(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function categorySlug(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return CATEGORY_ALIASES[normalized] || normalized;
}

export function getCategoryMeta(value) {
  const slug = categorySlug(value);
  const known = CATEGORY_META[slug];

  if (known) {
    return known;
  }

  return {
    label: prettifyCategory(value) || "Category",
    slug,
    summary: "Freshly grouped from the backend menu.",
    accent: "#E53935",
    tint: "rgba(229, 57, 53, 0.12)",
    image: null,
    fallback: ["#fff8f3", "#ffe2cf", "#ffc0a6"],
  };
}

export function sortSectionsByPriority(sections) {
  return [...sections].sort((a, b) => {
    const aSlug = categorySlug(a?.title);
    const bSlug = categorySlug(b?.title);
    const aIndex = CATEGORY_PRIORITY.indexOf(aSlug);
    const bIndex = CATEGORY_PRIORITY.indexOf(bSlug);

    if (aIndex === -1 && bIndex === -1) {
      return String(a?.title || "").localeCompare(String(b?.title || ""));
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
