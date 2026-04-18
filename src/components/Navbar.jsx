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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://localhost:3443";
const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE; // keep this in your .env

// sample uploaded screenshot path (you asked to include the file path)
const UPLOADED_SCREENSHOT = "/mnt/data/c53e2ca1-42d6-45e6-9cda-47676f31311e.png";

export default function Navbar() {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user, setAccessToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // cart
  const { cartItems } = useCart();
  const cartCount = useMemo(
    () => (cartItems || []).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0),
    [cartItems]
  );

  // bump animation
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

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setAccessToken(null);
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
  }, [mobileMenuOpen]);

  const isAdmin = user?.phone === ADMIN_PHONE;

  // --------------------------
  // Live search state & logic
  // --------------------------
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]); // items returned from backend
  const [open, setOpen] = useState(false); // dropdown visibility
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1); // for keyboard
  const cancelTokenRef = useRef(null);
  const debounceRef = useRef(null);

  // Helper: clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setOpen(false);
    setHighlightIndex(-1);
  }, []);

  // Fetch search results (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cancelTokenRef.current) {
      // cancel previous request if any (axios)
      cancelTokenRef.current.cancel("New search started");
    }

    if (!query || query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        cancelTokenRef.current = axios.CancelToken.source();
        // Call your backend search endpoint
        const res = await axios.get(`${API_BASE_URL}/api/items/search`, {
          params: { q: query.trim() },
          cancelToken: cancelTokenRef.current.token,
          timeout: 8000,
        });
        setResults(Array.isArray(res.data.items) ? res.data.items : res.data || []);
        setOpen(true);
        setHighlightIndex(-1);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Search error:", err.response?.data || err.message);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // keyboard handling
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
    } else if (e.key === "Escape") {
      clearSearch();
    }
  };

  // close dropdown on navigation / blur
  useEffect(() => {
    const handleRouteChange = () => setOpen(false);
    // close on click outside is handled by main listener, but also close dropdown on route change
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  // click result
  const visitProduct = (item) => {
    navigate(`/product/${item._id || item.id}`);
    clearSearch();
  };

  // fallback image if item.img missing — using your uploaded screenshot as placeholder
  const getImg = (item) => item?.img || UPLOADED_SCREENSHOT;

  // --------------------------
  // Render
  // --------------------------
  return (
    <>
      <nav className="w-full bg-white shadow-md px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        {/* Left: Brand */}
        <div className="flex items-center">
          <Link to="/" className="font-bold text-2xl md:text-3xl text-red-600">
            Clean-Chops
          </Link>
        </div>

        {/* Center: Search (desktop & mobile full-width) */}
        <div className="flex-1 mx-4">
          <div className="relative max-w-xl mx-auto">
            <label htmlFor="nav-search" className="sr-only">
              Search items
            </label>
            <input
              id="nav-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (results.length > 0) setOpen(true);
              }}
              placeholder="Search items... e.g. chicken, boneless, 1kg"
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
              aria-autocomplete="list"
              aria-controls="nav-search-listbox"
              aria-expanded={open}
              role="combobox"
            />

            {/* Clear / loading icon */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {loading ? (
                <svg className="w-5 h-5 animate-spin text-gray-500" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : query ? (
                <button
                  aria-label="Clear search"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => clearSearch()}
                >
                  ✕
                </button>
              ) : null}
            </div>

            {/* Dropdown */}
            {open && results && results.length > 0 && (
              <ul
                id="nav-search-listbox"
                role="listbox"
                aria-label="Search results"
                className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-auto"
              >
                {results.map((item, idx) => {
                  const highlighted = idx === highlightIndex;
                  return (
                    <li
                      key={item._id || item.id || idx}
                      role="option"
                      aria-selected={highlighted}
                      onMouseEnter={() => setHighlightIndex(idx)}
                      onMouseLeave={() => setHighlightIndex(-1)}
                      onClick={() => visitProduct(item)}
                      className={`flex gap-3 items-center px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                        highlighted ? "bg-gray-100" : ""
                      }`}
                    >
                      <img src={getImg(item)} alt={item.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{item.name}</div>
                        <div className="text-xs text-gray-500 truncate">{item.desc || ""}</div>
                      </div>
                      <div className="text-sm font-semibold text-[#E53935]">₹{item.price}</div>
                    </li>
                  );
                })}
                <li className="text-center text-xs text-gray-500 py-2">
                  Showing {results.length} result{results.length > 1 ? "s" : ""}
                </li>
              </ul>
            )}

            {/* No results */}
            {open && !loading && results && results.length === 0 && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
                No items found
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart / User */}
        <div className="flex items-center space-x-4 md:space-x-6 relative">
          <Link
            to="/cart"
            className="relative rounded-full p-2 hover:bg-orange-100 transition-shadow shadow-sm hover:shadow-md"
            aria-label="Cart"
          >
            <img src="https://img.icons8.com/fluency-systems-regular/48/shopping-cart--v1.png" alt="cart" className="h-7 w-7" />
            {cartCount > 0 && (
              <div className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 shadow-md transform ${bumped ? "scale-110" : "scale-100"} transition-transform`}>
                {cartCount}
              </div>
            )}
          </Link>

          <div className="hidden md:block relative" ref={userMenuRef}>
            <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="rounded-full p-2 hover:bg-orange-100 shadow-sm hover:shadow-md transition">
              <img className="w-7 h-7" src="https://img.icons8.com/fluency-systems-regular/48/user--v1.png" alt="user" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-lg z-50">
                {isAdmin && <Link to="/admin/orders" className="block px-4 py-2 hover:bg-gray-100 font-semibold text-red-500">Admin Panel</Link>}
                <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Profile 👤</Link>
                <Link to="/orderspage" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Orders  🛒</Link>
                <Link to="/support" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Support 📞</Link>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">Logout</button>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button aria-label="Open menu" className="p-2 rounded-full hover:bg-orange-100 shadow-sm" onClick={() => setMobileMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide menu (same as before) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-40" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition duration-300 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 space-y-6 flex flex-col h-full">
          <button onClick={() => setMobileMenuOpen(false)} className="mb-6 p-2 rounded-full hover:bg-gray-200">❌</button>

          {isAdmin && <Link to="/admin/orders" className="block px-2 py-3 rounded hover:bg-orange-100 font-semibold text-red-500" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>}
          <Link to="/profile" className="block px-2 py-3 rounded hover:bg-orange-100" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
          <Link to="/orderspage" className="block px-2 py-3 rounded hover:bg-orange-100" onClick={() => setMobileMenuOpen(false)}>Orders</Link>

          <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="px-2 py-3 rounded hover:bg-orange-100 text-left">Logout</button>

          <div className="flex-grow" />
        </div>
      </div>
    </>
  );
}
