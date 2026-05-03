import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user, accessToken } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  // FIX: track in-flight requests to prevent race conditions between
  // rapid optimistic updates (e.g. user tapping +/- quickly)
  const [syncing, setSyncing] = useState(false);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    if (!user || !accessToken) {
      setCartItems([]);
      return;
    }

    let cancelled = false;

    async function loadCart() {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!cancelled) setCartItems(data.cart ?? []);
      } catch (err) {
        console.error("Failed to load cart:", err);
      }
    }

    loadCart();
    return () => { cancelled = true; };
  }, [user, accessToken]);

  /* ---------------- HELPERS ---------------- */

  // FIX: wrapped in useCallback so consumers that list authHeaders as a
  // dependency don't re-render on every render of CartProvider
  const authHeaders = useCallback(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  /* ---------------- MUTATIONS ---------------- */

  const addItem = useCallback(async (item) => {
    const payload = {
      _id: item._id ?? item.id,
      selectedSize: Number(item.selectedSize),
      quantity: Number(item.quantity) || 1,
    };

    // Optimistic update
    setCartItems((items) => {
      const idx = items.findIndex(
        (i) => i._id === payload._id && i.selectedSize === payload.selectedSize
      );
      if (idx !== -1) {
        const copy = [...items];
        // FIX: cap optimistic quantity at 10 to stay in sync with UI limits
        const newQty = Math.min(copy[idx].quantity + payload.quantity, 10);
        copy[idx] = { ...copy[idx], quantity: newQty };
        return copy;
      }
      return [...items, { ...payload, price: item.price, name: item.name, img: item.img }];
    });

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart/add`,
        payload,
        { headers: authHeaders() }
      );
      setCartItems(data.cart);
    } catch (err) {
      console.error("Add item failed:", err);
      // Rollback
      setCartItems((items) => {
        const idx = items.findIndex(
          (i) => i._id === payload._id && i.selectedSize === payload.selectedSize
        );
        if (idx === -1) return items;
        const copy = [...items];
        const reverted = copy[idx].quantity - payload.quantity;
        if (reverted <= 0) {
          copy.splice(idx, 1);
        } else {
          copy[idx] = { ...copy[idx], quantity: reverted };
        }
        return copy;
      });
    }
  }, [authHeaders]);

  const removeItem = useCallback(async (_id, selectedSize) => {
    const snapshot = cartItems;

    setCartItems((items) =>
      items.filter((i) => !(i._id === _id && i.selectedSize === selectedSize))
    );

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart/remove`,
        { _id, selectedSize },
        { headers: authHeaders() }
      );
      setCartItems(data.cart);
    } catch (err) {
      console.error("Remove item failed:", err);
      setCartItems(snapshot);
    }
  }, [authHeaders, cartItems]);

  const updateQuantity = useCallback(async (_id, selectedSize, quantity) => {
    if (quantity < 1 || quantity > 10) return;

    const snapshot = cartItems;

    setCartItems((items) =>
      items.map((i) =>
        i._id === _id && i.selectedSize === selectedSize ? { ...i, quantity } : i
      )
    );

    if (syncing) return;
    setSyncing(true);

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/api/cart/update`,
        { _id, selectedSize, quantity },
        { headers: authHeaders() }
      );
      setCartItems(data.cart);
    } catch (err) {
      console.error("Update quantity failed:", err);
      setCartItems(snapshot);
    } finally {
      setSyncing(false);
    }
  }, [authHeaders, cartItems, syncing]);

  const clearCart = useCallback(async () => {
    const snapshot = cartItems;
    setCartItems([]);

    try {
      await axios.post(
        `${API_BASE_URL}/api/cart/clear`,
        {},
        { headers: authHeaders() }
      );
    } catch (err) {
      console.error("Clear cart failed:", err);
      setCartItems(snapshot);
    }
  }, [authHeaders, cartItems]);

  // FIX: memoize the context value object so it doesn't create a new reference
  // on every render — this is what SonarLint S6481 warns about.
  // Without this, every consumer re-renders even when nothing actually changed.
  const contextValue = useMemo(
    () => ({ cartItems, addItem, removeItem, updateQuantity, clearCart, syncing }),
    [cartItems, addItem, removeItem, updateQuantity, clearCart, syncing]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}