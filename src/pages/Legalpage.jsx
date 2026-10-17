import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/images/logo.png";
import {
  policyContact,
  policySections,
  policyUpdatedAt,
} from "../data/policies.js";
import { policySectionForLocation } from "../data/policyRoutes.js";

export default function LegalPage() {
  const { pathname, hash } = useLocation();
  const [active, setActive] = useState(() => policySectionForLocation(pathname, hash));
  const sectionRefs = useRef({});

  useEffect(() => {
    const target = policySectionForLocation(pathname, hash);
    document.title = `${policySections.find(({ id }) => id === target).title} | CleanChops`;
    const frame = requestAnimationFrame(() => {
      if (hash || pathname.replace(/\/+$/, "") !== "/info") {
        sectionRefs.current[target]?.scrollIntoView({ block: "start" });
      } else {
        window.scrollTo({ top: 0 });
      }
    });
    return () => {
      cancelAnimationFrame(frame);
      document.title = "CleanChops";
    };
  }, [pathname, hash]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-12% 0px -65% 0px" });
    Object.values(sectionRefs.current).forEach((section) => section && observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="cc-policy-page">
      <a className="cc-policy-skip" href="#policy-content">Skip to policies</a>
      <header className="cc-policy-header">
        <Link to="/" aria-label="CleanChops home"><img src={logo} alt="CleanChops" width="186" height="48" /></Link>
        <nav aria-label="Website navigation">
          <Link to="/">Back to shop</Link>
          <Link to="/contact-us">Contact us</Link>
        </nav>
      </header>
      <div className="cc-policy-hero">
        <div>
          <p className="cc-policy-eyebrow">CleanChops / Customer information</p>
          <h1>Policies &amp;<br />Information</h1>
          <p>For our website, Android app and iOS app. Available to everyone, without signing in.</p>
          <p className="cc-policy-date">Last updated: <time dateTime="2026-10-17">{policyUpdatedAt}</time></p>
        </div>
      </div>
      <div className="cc-legal-layout">
        <nav className="cc-legal-nav" aria-label="Policy sections">
          {policySections.map(({ id, label }) => (
            <Link key={id} to={`/info#${id}`} aria-current={active === id ? "location" : undefined}>{label}</Link>
          ))}
        </nav>
        <main id="policy-content" className="cc-legal-content" tabIndex={-1}>
          {policySections.map((section, index) => (
            <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}
              ref={(element) => { sectionRefs.current[section.id] = element; }}>
              <div className="cc-policy-section-heading">
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
              </div>
              {section.content.map(({ heading, body, links }) => (
                <div className="cc-policy-block" key={heading}>
                  <h3>{heading}</h3>
                  <p>{body}</p>
                  {links && <ul className="cc-policy-contact-links">
                    {links.map(({ label, href }) => <li key={href}><a href={href}
                      {...(href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</a></li>)}
                  </ul>}
                </div>
              ))}
            </section>
          ))}
        </main>
      </div>
      <footer className="cc-policy-footer">
        <p>CleanChops customer support</p>
        <a href={`mailto:${policyContact.email}`}>{policyContact.email}</a>
        <a href={policyContact.phoneHref}>{policyContact.phone}</a>
        <Link to="/support">Send a support enquiry</Link>
      </footer>
    </div>
  );
}
