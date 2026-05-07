// src/components/Navbar.jsx
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import logo from "../assets/images/logo.png";
import logoSmall from "../assets/images/smalllogo.png";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:3443";
const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE;

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const {
    user,
    accessToken,
    loading: authLoading,
    logout,
  } = useContext(AuthContext);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  const { cartItems } = useCart();
  const cartCount = useMemo(
    () =>
      (cartItems || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),
    [cartItems],
  );

  // bump animation on cart count change
  const [bumped, setBumped] = useState(false);
  const prevCountRef = useRef(cartCount);
  useEffect(() => {
    if (prevCountRef.current !== cartCount) {
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 300);
      prevCountRef.current = cartCount;
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  // subtle shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.phone === ADMIN_PHONE;

  // ── Search state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const cancelTokenRef = useRef(null);
  const debounceRef = useRef(null);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cancelTokenRef.current) cancelTokenRef.current.cancel("New search");
    if (!query?.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        cancelTokenRef.current = axios.CancelToken.source();
        const res = await axios.get(`${API_BASE_URL}/api/items/search`, {
          params: { q: query.trim() },
          cancelToken: cancelTokenRef.current.token,
          timeout: 8000,
        });
        setResults(
          Array.isArray(res.data.items) ? res.data.items : res.data || [],
        );
        setOpen(true);
        setHighlightIndex(-1);
      } catch (err) {
        if (!axios.isCancel(err)) console.error("Search error:", err.message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[highlightIndex] ?? results[0];
      if (item) {
        navigate(`/product/${item._id || item.id}`);
        clearSearch();
      }
    } else if (e.key === "Escape") clearSearch();
  };

  const visitProduct = (item) => {
    navigate(`/product/${item._id || item.id}`);
    clearSearch();
  };

  // ── Theme tokens (matches your existing warm light theme) ─────────────────
  const BG = "#ffffff";
  const BORDER = "#f0ddd0";
  const SURFACE = "#fdf8f5";
  const RED = "#E53935";
  const TEXT_MID = "#999";

  return (
    <>
      {/* ── Main navbar ── */}
      <nav
        style={{
          width: "100%",
          background: BG,
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${BORDER}`,
          boxShadow: scrolled ? "0 2px 16px rgba(229,100,57,0.10)" : "none",
          transition: "box-shadow 0.2s",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          {/* Logo — full on md+, icon-only on small */}
          <Link to="/" className="flex items-center flex-shrink-0">
            {/* Main logo (desktop) */}
            <img
              src={logo}
              alt="CleanChops"
              className="hidden sm:block h-10 rounded-lg"
            />

            {/* Small logo (mobile) */}
            <img
              src={logoSmall}
              alt="CleanChops"
              className="block sm:hidden h-8 rounded"
            />
          </Link>

          {/* Search */}
          <div className="cc-search" style={{ position: "relative" }}>
            <label htmlFor="nav-search" className="sr-only">
              Search items
            </label>
            <svg
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "15px",
                height: "15px",
                pointerEvents: "none",
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#bbb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              id="nav-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (results.length > 0) setOpen(true);
              }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search chicken, boneless, 500g…"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="nav-search-listbox"
              aria-expanded={open}
              style={{
                width: "100%",
                padding: "9px 36px 9px 38px",
                background: SURFACE,
                border: `1.5px solid ${BORDER}`,
                borderRadius: "50px",
                color: "#333",
                fontSize: "13.5px",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocusCapture={(e) => {
                e.target.style.borderColor = RED;
                e.target.style.boxShadow = "0 0 0 3px rgba(229,57,53,0.10)";
                if (results.length > 0) setOpen(true);
              }}
              onBlurCapture={(e) => {
                e.target.style.borderColor = BORDER;
                e.target.style.boxShadow = "none";
              }}
            />

            {/* Loading / clear */}
            <div
              style={{
                position: "absolute",
                right: "13px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              {loading ? (
                <svg
                  style={{
                    width: "15px",
                    height: "15px",
                    animation: "cc-spin 0.8s linear infinite",
                    color: "#ccc",
                  }}
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="32"
                    strokeDashoffset="12"
                  />
                </svg>
              ) : query ? (
                <button
                  aria-label="Clear search"
                  onClick={clearSearch}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#bbb",
                    fontSize: "15px",
                    lineHeight: 1,
                    padding: "2px",
                    display: "flex",
                  }}
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Results dropdown */}
            {open && results.length > 0 && (
              <ul
                id="nav-search-listbox"
                role="listbox"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "16px",
                  boxShadow: "0 12px 32px rgba(229,100,57,0.12)",
                  maxHeight: "320px",
                  overflowY: "auto",
                  listStyle: "none",
                  padding: "6px",
                  margin: 0,
                  zIndex: 60,
                }}
              >
                {results.map((item, idx) => (
                  <li
                    key={item._id || item.id || idx}
                    role="option"
                    aria-selected={idx === highlightIndex}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => visitProduct(item)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      borderRadius: "10px",
                      cursor: "pointer",
                      background:
                        idx === highlightIndex ? "#fdf8f5" : "transparent",
                      transition: "background 0.1s",
                    }}
                  >
                    <img
                      src={item.img}
                      alt={item.name}
                      style={{
                        width: "44px",
                        height: "44px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        flexShrink: 0,
                        border: `1px solid ${BORDER}`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13.5px",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {item.name}
                      </div>
                      {item.desc && (
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#aaa",
                            marginTop: "2px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.desc}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: RED,
                        flexShrink: 0,
                      }}
                    >
                      ₹{item.price}
                    </div>
                  </li>
                ))}
                <li
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: "#ccc",
                    padding: "6px 0 2px",
                  }}
                >
                  {results.length} result{results.length > 1 ? "s" : ""}
                </li>
              </ul>
            )}

            {/* No results */}
            {open && !loading && results.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: "16px",
                  boxShadow: "0 8px 24px rgba(229,100,57,0.10)",
                  padding: "1rem",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#bbb",
                  zIndex: 60,
                }}
              >
                No items found
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="cc-spacer" />

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Cart */}
            <Link
              to="/cart"
              aria-label="Cart"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: cartCount > 0 ? "#fff1f0" : SURFACE,
                border: `1.5px solid ${cartCount > 0 ? "#fcc9c7" : BORDER}`,
                textDecoration: "none",
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              <svg
                style={{ width: "19px", height: "19px" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke={cartCount > 0 ? RED : "#bbb"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    background: RED,
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    minWidth: "18px",
                    height: "18px",
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    border: "2px solid #fff",
                    transform: bumped ? "scale(1.2)" : "scale(1)",
                    transition: "transform 0.2s",
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {!authLoading && !accessToken ? (
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "9px 16px",
                  background: "linear-gradient(135deg,#fb923c,#E53935)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 6px 18px rgba(229,57,53,0.18)",
                }}
              >
                Login
              </button>
            ) : null}

            {!authLoading && accessToken ? (
              <div style={{ position: "relative" }} ref={userMenuRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 14px 7px 8px",
                    background: SURFACE,
                    border: `1.5px solid ${BORDER}`,
                    borderRadius: "50px",
                    cursor: "pointer",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#f0b8a8";
                    e.currentTarget.style.boxShadow =
                      "0 2px 8px rgba(229,100,57,0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#fb923c,#E53935)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <svg
                    style={{
                      width: "13px",
                      height: "13px",
                      color: TEXT_MID,
                      transform: userDropdownOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      width: "200px",
                      background: "#fff",
                      border: `1px solid ${BORDER}`,
                      borderRadius: "16px",
                      boxShadow: "0 12px 32px rgba(229,100,57,0.12)",
                      overflow: "hidden",
                      zIndex: 60,
                    }}
                  >
                    {user?.name && (
                      <div
                        style={{
                          padding: "12px 14px 10px",
                          borderBottom: `1px solid ${BORDER}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#1a1a1a",
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: "#bbb",
                            marginTop: "2px",
                          }}
                        >
                          {user.phone}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: "6px" }}>
                      {isAdmin && (
                        <DropItem
                          to="/admin/orders"
                          label="Admin Panel"
                          icon="⚡"
                          accent={RED}
                          onClick={() => setUserDropdownOpen(false)}
                        />
                      )}
                      <DropItem
                        to="/profile"
                        label="Profile"
                        icon="👤"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <DropItem
                        to="/orderspage"
                        label="My Orders"
                        icon="📦"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <DropItem
                        to="/support"
                        label="Support"
                        icon="💬"
                        onClick={() => setUserDropdownOpen(false)}
                      />
                      <DropItem
                        to="/info"
                        label="About & Policies"
                        icon="📄"
                        onClick={() => setUserDropdownOpen(false)}
                      />

                      <div
                        style={{
                          borderTop: `1px solid ${BORDER}`,
                          marginTop: "4px",
                          paddingTop: "4px",
                        }}
                      >
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleLogout();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "13px",
                            color: "#bbb",
                            fontFamily: "inherit",
                            transition: "background 0.12s, color 0.12s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fdf8f5";
                            e.currentTarget.style.color = "#E53935";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "none";
                            e.currentTarget.style.color = "#bbb";
                          }}
                        >
                          <span style={{ fontSize: "14px" }}>🚪</span> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <style>{`
        @keyframes cc-spin { to { transform: rotate(360deg); } }
        .sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0 }

    

        /* Search: full width on mobile */
        .cc-search { flex: 1; max-width: 460px; position: relative; }

        /* Hide spacer on mobile so search fills the gap */
        .cc-spacer { flex: 1; }

        @media (max-width: 640px) {
   
          .cc-spacer     { display: none  !important; }
          .cc-search     { flex: 1; max-width: unset; }
        }
      `}</style>
    </>
  );
}

// ─── Dropdown item ────────────────────────────────────────────────────────────
function DropItem({ to, label, icon, accent, onClick }) {
  const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={() => {
        onClick?.();
        navigate(to);
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "8px 10px",
        borderRadius: "8px",
        background: hov ? "#fdf8f5" : "none",
        border: "none",
        cursor: "pointer",
        fontSize: "13px",
        color: accent ?? (hov ? "#1a1a1a" : "#888"),
        fontFamily: "inherit",
        textAlign: "left",
        transition: "background 0.12s, color 0.12s",
      }}
    >
      <span style={{ fontSize: "14px" }}>{icon}</span> {label}
    </button>
  );
}
