const UNCOKED_OPTIONS = [
  { grams: 250, label: "Solo Pack", rangeLabel: "230-270 g" },
  { grams: 500, label: "Duo Pack", rangeLabel: "480-520 g" },
  { grams: 750, label: "Family Pack", rangeLabel: "730-770 g" },
  { grams: 1000, label: "Party Pack", rangeLabel: "980-1020 g" },
];

const COOKED_OPTIONS = [
  { grams: 250, label: "Quarter", rangeLabel: "Enough for 1-2" },
  { grams: 500, label: "Half", rangeLabel: "Enough for 3-4" },
  { grams: 1000, label: "Full", rangeLabel: "Enough for 6-8" },
];

const RTC_OPTIONS = [
  { grams: 200, label: "200g", rangeLabel: "Good for 1-2" },
  { grams: 400, label: "400g", rangeLabel: "Good for 3-4" },
];

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizedCategoryKey(category) {
  return String(category || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function isCookedCategory(category) {
  return String(category || "").trim().toLowerCase() === "cooked";
}

export function isRtcCategory(category) {
  const normalized = normalizedCategoryKey(category);
  return normalized.includes("readytocook") || normalized.includes("rtc");
}

export function isSingleCategory(category) {
  const normalized = normalizedCategoryKey(category);
  return (
    normalized.includes("dessert") ||
    normalized.includes("drink") ||
    normalized.includes("beverage") ||
    normalized.includes("yogurt") ||
    normalized.includes("single")
  );
}

function hasCookedPriceFields(item) {
  return ["cookedQuarterPrice", "cookedHalfPrice", "cookedFullPrice"].some(
    (key) => toNumber(item?.[key]) > 0,
  );
}

function hasRtcPriceFields(item) {
  return [
    "rtc200Price",
    "200price",
    "200Price",
    "200gPrice",
    "200GPrice",
    "price200",
    "price200g",
    "rtc400Price",
    "400price",
    "400Price",
    "400gPrice",
    "400GPrice",
    "price400",
    "price400g",
  ].some((key) => toNumber(item?.[key]) > 0);
}

export function pricingModeForItem(item) {
  const explicit = String(item?.pricingMode || "").trim().toLowerCase();
  if (explicit) return explicit;

  if (Array.isArray(item?.pricingOptions) && item.pricingOptions.length > 0) {
    return "rtc";
  }

  const category = item?.category;
  if (isCookedCategory(category) || hasCookedPriceFields(item)) return "cooked";
  if (isRtcCategory(category) || hasRtcPriceFields(item)) return "rtc";
  if (isSingleCategory(category) || item?.servingSize != null) return "single";
  return "uncooked";
}

function packPriceFromBase(basePrice, grams) {
  const base = toNumber(basePrice);

  switch (grams) {
    case 250:
      return base * 0.25 + 10;
    case 500:
      return base * 0.5 + 5;
    case 750:
      return base * 0.75;
    case 1000:
      return base;
    default:
      return base * (grams / 1000);
  }
}

function cookedPackPriceForItem(item, grams) {
  const fallback = packPriceFromBase(item?.price, grams);

  if (grams === 250) {
    return toNumber(item?.cookedQuarterPrice) > 0
      ? toNumber(item.cookedQuarterPrice)
      : fallback;
  }

  if (grams === 500) {
    return toNumber(item?.cookedHalfPrice) > 0
      ? toNumber(item.cookedHalfPrice)
      : fallback;
  }

  if (grams === 1000) {
    return toNumber(item?.cookedFullPrice) > 0
      ? toNumber(item.cookedFullPrice)
      : fallback;
  }

  return fallback;
}

function normalizedRtcOptions(item) {
  const raw = Array.isArray(item?.pricingOptions) ? item.pricingOptions : [];
  return raw
    .map((option, index) => {
      if (!option || typeof option !== "object") return null;
      const gramsCandidate =
        option.size ?? option.grams ?? option.value ?? option.servingSize ?? (index + 1);
      const grams = Number.parseInt(String(gramsCandidate), 10);
      const price = toNumber(option.price);
      return {
        grams: Number.isFinite(grams) ? grams : index + 1,
        label: String(option.label || option.name || `${gramsCandidate}g`).trim(),
        rangeLabel: String(
          option.rangeLabel || option.range || option.description || "Ready to cook",
        ).trim(),
        price: price > 0 ? price : null,
      };
    })
    .filter(Boolean);
}

function rtcPackPriceForItem(item, grams) {
  const explicitOptions = normalizedRtcOptions(item);
  const found = explicitOptions.find((option) => option.grams === grams);
  if (found?.price != null) return found.price;

  if (grams === 200) {
    const explicit = toNumber(
      item?.rtc200Price ??
        item?.["200price"] ??
        item?.["200Price"] ??
        item?.["200gPrice"] ??
        item?.["200GPrice"] ??
        item?.price200 ??
        item?.price200g,
    );
    if (explicit > 0) return explicit;
  }

  if (grams === 400) {
    const explicit = toNumber(
      item?.rtc400Price ??
        item?.["400price"] ??
        item?.["400Price"] ??
        item?.["400gPrice"] ??
        item?.["400GPrice"] ??
        item?.price400 ??
        item?.price400g,
    );
    if (explicit > 0) return explicit;
  }

  return toNumber(item?.price);
}

export function packOptionsForItem(item) {
  const mode = pricingModeForItem(item);

  if (mode === "single") return [];

  if (mode === "cooked") {
    return COOKED_OPTIONS.map((option) => ({
      ...option,
      price: cookedPackPriceForItem(item, option.grams),
    }));
  }

  if (mode === "rtc") {
    const explicitOptions = normalizedRtcOptions(item);
    if (explicitOptions.length > 0) {
      return explicitOptions.map((option) => ({
        ...option,
        price: option.price ?? rtcPackPriceForItem(item, option.grams),
      }));
    }

    return RTC_OPTIONS.map((option) => ({
      ...option,
      price: rtcPackPriceForItem(item, option.grams),
    }));
  }

  return UNCOKED_OPTIONS.map((option) => ({
    ...option,
    price: packPriceFromBase(item?.price, option.grams),
  }));
}

export function packOptionForSize(grams, item) {
  const options = packOptionsForItem(item);
  return (
    options.find((option) => option.grams === grams) || {
      grams,
      label: grams <= 0 ? "Single" : `${grams}g`,
      rangeLabel: grams <= 0 ? "One serving" : `${grams} g`,
      price: grams <= 0 ? toNumber(item?.price) : undefined,
    }
  );
}

export function packDisplayText(grams, item) {
  const mode = pricingModeForItem(item);
  if (mode === "single" || grams <= 0) return "Single";

  const option = packOptionForSize(grams, item);
  if (option.label === option.rangeLabel || !option.rangeLabel) return option.label;
  return `${option.label} • ${option.rangeLabel}`;
}

export function getPackPriceForItem(item, grams) {
  return packOptionForSize(grams, item).price ?? toNumber(item?.price);
}

export function getOldPriceForItem(item, grams) {
  const oldPrice = item?.oldprice ?? item?.oldPrice;
  const base = toNumber(oldPrice);
  if (base <= 0) return null;

  const mode = pricingModeForItem(item);
  if (mode === "uncooked") return packPriceFromBase(base, grams);
  return base;
}

export function defaultSelectedSizeForItem(item) {
  const mode = pricingModeForItem(item);
  const explicitOptions = normalizedRtcOptions(item);

  if (mode === "cooked") return 250;
  if (mode === "rtc") return explicitOptions[0]?.grams ?? 200;
  if (mode === "single") return 0;
  return 250;
}

export function defaultDisplayPriceForItem(item) {
  if (!item) return 0;

  const mode = pricingModeForItem(item);
  if (mode === "cooked") {
    return toNumber(item.displayPrice) || toNumber(item.price) || cookedPackPriceForItem(item, 1000);
  }

  if (mode === "rtc") {
    const explicitOptions = normalizedRtcOptions(item);
    if (explicitOptions[0]?.price != null) return explicitOptions[0].price;
    return toNumber(item.displayPrice) || rtcPackPriceForItem(item, defaultSelectedSizeForItem(item));
  }

  if (mode === "single") {
    return toNumber(item.displayPrice) || toNumber(item.price);
  }

  return toNumber(item.displayPrice) || toNumber(item.price);
}
