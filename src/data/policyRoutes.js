export const publicPolicyRoutes = {
  "/info": "about",
  "/privacy-policy": "privacy",
  "/terms-and-conditions": "terms",
  "/refund-cancellation-policy": "refunds",
  "/shipping-delivery-policy": "delivery",
  "/contact-us": "contact",
};

export function isPublicPolicyPath(pathname) {
  return Object.hasOwn(publicPolicyRoutes, pathname.replace(/\/+$/, ""));
}

export function policySectionForLocation(pathname, hash = "") {
  const section = hash.replace(/^#/, "");
  return Object.values(publicPolicyRoutes).includes(section)
    ? section
    : publicPolicyRoutes[pathname.replace(/\/+$/, "")] || "about";
}
