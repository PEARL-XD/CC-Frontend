import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";

const sections = [
  {
    id: "about",
    label: "About Us",
    title: "About CleanChops",
    content: [
      {
        heading: "Who we are",
        body: "CleanChops is a modern, digital-first fresh meat delivery service built on one belief: buying meat should be as clean, reliable, and simple as ordering anything else online. We started because we were tired of the same problems everyone faces at a traditional butcher — unhygienic handling, inconsistent cuts, no transparency, and zero convenience.",
      },
      {
        heading: "What we do",
        body: "We source, process, and deliver fresh chicken directly to your door. Every order is handled in a controlled, sanitised environment — no open-market exposure, no middlemen touching your food at a roadside stall. You browse, you pick, you checkout. We handle everything else.",
      },
      {
        heading: "Our products",
        body: "We offer a curated range of chicken cuts — curry cut, washed curry cut, drumsticks, wings, breast pieces, and more. Each product is precisely portioned and hygienically packed so what you see in the app is exactly what arrives at your door.",
      },
      {
        heading: "Our mission",
        body: "To replace the broken, unhygienic traditional meat-buying experience with a trusted, tech-enabled service that respects your time, your health, and your kitchen. CleanChops isn't just a meat shop — it's a standard.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery Policy",
    title: "Delivery Policy",
    content: [
      {
        heading: "Delivery time",
        body: "We deliver as fast as possible. Our guaranteed delivery window is 60–90 minutes from the time your order is confirmed. In most cases, we aim to deliver faster than that — but we never compromise on hygiene or handling speed to rush an order.",
      },
      {
        heading: "Delivery area",
        body: "We currently operate within our designated serviceable zones. You can check whether your location is serviceable at checkout. We are actively expanding our delivery coverage — if we're not in your area yet, we will be soon.",
      },
      {
        heading: "Order tracking",
        body: "Once your order is confirmed, you can track its status in real time through the CleanChops app or website. You'll receive updates at each stage — order received, being prepared, out for delivery, and delivered.",
      },
      {
        heading: "Delivery charges",
        body: "Delivery charges (if any) will be clearly displayed at checkout before you confirm your order. We occasionally run free delivery promotions — keep an eye on the app for offers.",
      },
      {
        heading: "Failed deliveries",
        body: "If we are unable to deliver your order due to an incorrect address or unavailability at the delivery location, our team will attempt to contact you. Repeated failed attempts may result in order cancellation. Please ensure your address and contact details are accurate.",
      },
    ],
  },
  {
    id: "privacy",
    label: "Privacy Policy",
    title: "Privacy Policy",
    content: [
      {
        heading: "Information we collect",
        body: "We collect information you provide directly — name, phone number, delivery address, and payment details when you place an order. We also collect usage data such as the pages you visit and features you use, to improve your experience.",
      },
      {
        heading: "How we use your information",
        body: "Your information is used to process and deliver your orders, communicate order updates, provide customer support, and improve our service. We do not sell your personal data to third parties.",
      },
      {
        heading: "Payment data",
        body: "All payment transactions are processed securely through Razorpay, our payment gateway partner. CleanChops does not store your card details or sensitive payment information on our servers.",
      },
      {
        heading: "Data sharing",
        body: "We may share your delivery address and contact number with our delivery partners solely for the purpose of completing your order. We do not share your data with advertisers or unrelated third parties.",
      },
      {
        heading: "Your rights",
        body: "You may request access to, correction of, or deletion of your personal data at any time by contacting our support team. We will respond to all valid requests within a reasonable timeframe.",
      },
      {
        heading: "Cookies",
        body: "Our website uses cookies to maintain your session and improve browsing experience. You can disable cookies in your browser settings, though some features may not function correctly without them.",
      },
    ],
  },
  {
    id: "terms",
    label: "Terms of Use",
    title: "Terms of Use",
    content: [
      {
        heading: "Acceptance of terms",
        body: "By accessing or using CleanChops — whether through our website or app — you agree to be bound by these Terms of Use. If you do not agree, please do not use our platform.",
      },
      {
        heading: "Eligibility",
        body: "You must be at least 18 years old and capable of entering into a legally binding agreement to use our services. By placing an order, you confirm that you meet these requirements.",
      },
      {
        heading: "Orders and payments",
        body: "All orders are subject to product availability and our delivery coverage area. Prices are as displayed at checkout. Payment must be completed at the time of order. We reserve the right to cancel orders in cases of pricing errors or stock unavailability, with a full refund issued.",
      },
      {
        heading: "Cancellations and refunds",
        body: "Orders may be cancelled before they are confirmed for preparation. Once an order is being prepared, cancellations may not be accepted. In cases of quality issues or incorrect items delivered, please contact us within 2 hours of delivery for a resolution.",
      },
      {
        heading: "Product quality",
        body: "We take hygiene and quality seriously. All products are fresh and processed on the day of delivery. In the rare event that a product does not meet our quality standards upon arrival, contact our support team immediately with photos for a swift resolution.",
      },
      {
        heading: "Prohibited use",
        body: "You agree not to misuse our platform — including attempting to manipulate pricing, submitting fraudulent orders, or interfering with the normal operation of our services. Violations may result in account suspension.",
      },
      {
        heading: "Changes to terms",
        body: "We may update these Terms of Use from time to time. Continued use of CleanChops after changes are posted constitutes your acceptance of the revised terms. We recommend reviewing this page periodically.",
      },
    ],
  },
];

export default function LegalPage() {
  const [active, setActive] = useState("about");
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    sections.forEach((s) => {
      if (sectionRefs.current[s.id]) observer.observe(sectionRefs.current[s.id]);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  return (
    <>
    <Navbar />
    <div className="w-full min-h-screen" style={{ background: "#0d0d0d", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top header */}
      <div style={{ background: "#E53935", padding: "3rem 2rem 2.5rem" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>
            CleanChops
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, color: "#fff", lineHeight: 1.05 }}>
            Policies &<br />Information
          </h1>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 1.5rem", display: "grid", gridTemplateColumns: "180px 1fr", gap: "3rem", alignItems: "start" }}>

        {/* Sticky sidebar nav */}
        <nav style={{ position: "sticky", top: "80px", paddingTop: "2.5rem" }}>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "0.625rem 0.875rem",
                marginBottom: "4px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: active === s.id ? 600 : 400,
                color: active === s.id ? "#fff" : "#555",
                background: active === s.id ? "rgba(229,57,53,0.12)" : "transparent",
                borderLeft: `2px solid ${active === s.id ? "#E53935" : "transparent"}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div style={{ paddingTop: "2.5rem", paddingBottom: "6rem" }}>
          {sections.map((s, si) => (
            <div
              key={s.id}
              id={s.id}
              ref={(el) => (sectionRefs.current[s.id] = el)}
              style={{ marginBottom: si < sections.length - 1 ? "4rem" : 0 }}
            >
              {/* Section heading */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "13px", fontWeight: 900, color: "#2a2a2a" }}>
                  0{si + 1}
                </span>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#E53935", flexShrink: 0 }} />
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, color: "#fff" }}>
                  {s.title}
                </h2>
              </div>

              {/* Sub-sections */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {s.content.map((block, bi) => (
                  <div key={bi} style={{ paddingLeft: "1.25rem", borderLeft: "1px solid #1f1f1f" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#ccc", marginBottom: "0.4rem" }}>
                      {block.heading}
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: 1.85, color: "#555" }}>
                      {block.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              {si < sections.length - 1 && (
                <div style={{ height: "1px", background: "#1a1a1a", marginTop: "3.5rem" }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}