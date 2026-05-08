import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AdminInventoryPage() {
  const { accessToken } = useContext(AuthContext);

  const [items, setItems] = useState([]);
  const [cookedEnabled, setCookedEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingStorefront, setSavingStorefront] = useState(false);
  const [savingItemId, setSavingItemId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${accessToken}` }),
    [accessToken]
  );

  const fetchInventory = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/admin/inventory`, {
        headers: authHeaders,
      });

      setCookedEnabled(data.settings?.cookedEnabled ?? true);
      setItems(
        (data.items || []).map((item) => ({
          ...item,
          priceDraft: item.price ?? "",
          oldpriceDraft: item.oldprice ?? "",
        }))
      );
    } catch (err) {
      console.error("Failed to load inventory:", err.response?.data || err.message);
      setErrorMsg("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeaders]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const showSuccess = (message) => {
    setSuccessMsg(message);
    setTimeout(() => setSuccessMsg(""), 1800);
  };

  const updateCookedEnabled = async (nextValue) => {
    const previous = cookedEnabled;
    setCookedEnabled(nextValue);
    setSavingStorefront(true);
    setErrorMsg("");

    try {
      await axios.patch(
        `${API_BASE_URL}/api/admin/storefront`,
        { cookedEnabled: nextValue },
        { headers: authHeaders }
      );

      showSuccess(nextValue ? "Cooked section enabled." : "Cooked section disabled.");
    } catch (err) {
      console.error("Failed to update storefront:", err.response?.data || err.message);
      setCookedEnabled(previous);
      setErrorMsg("Failed to update cooked section.");
    } finally {
      setSavingStorefront(false);
    }
  };

  const updateDraft = (itemId, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item._id === itemId ? { ...item, [field]: value } : item))
    );
  };

  const updateItem = async (item, patch) => {
    setSavingItemId(item._id);
    setErrorMsg("");

    try {
      const payload = { ...patch };

      const { data } = await axios.patch(
        `${API_BASE_URL}/api/admin/items/${item._id}`,
        payload,
        { headers: authHeaders }
      );

      const updated = data.item;

      setItems((prev) =>
        prev.map((old) =>
          old._id === item._id
            ? {
                ...old,
                ...updated,
                priceDraft: updated.price ?? "",
                oldpriceDraft: updated.oldprice ?? "",
              }
            : old
        )
      );

      showSuccess("Item updated.");
    } catch (err) {
      console.error("Failed to update item:", err.response?.data || err.message);
      setErrorMsg(err.response?.data?.error || "Failed to update item.");
      await fetchInventory();
    } finally {
      setSavingItemId(null);
    }
  };

  const savePrice = async (item) => {
    const price = Number(item.priceDraft);
    const oldprice =
      item.oldpriceDraft === "" || item.oldpriceDraft === null
        ? null
        : Number(item.oldpriceDraft);

    if (!Number.isFinite(price) || price < 0) {
      setErrorMsg("Price must be a valid number.");
      return;
    }

    if (oldprice !== null && (!Number.isFinite(oldprice) || oldprice < 0)) {
      setErrorMsg("Old price must be a valid number.");
      return;
    }

    await updateItem(item, { price, oldprice });
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      return name.includes(q) || category.includes(q);
    });
  }, [items, search]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((groups, item) => {
      const key = item.category || "Uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {});
  }, [filteredItems]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto p-6 text-center text-gray-600">
          Loading inventory...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              Admin Inventory
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage item stock, prices, and cooked section availability.
            </p>
          </div>

          <button
            onClick={fetchInventory}
            className="w-fit px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-semibold hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {successMsg}
          </div>
        )}

        <section className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Storefront Availability</h2>
              <p className="text-sm text-gray-500">
                Turn this off to show cooked items as coming soon.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <span className="text-sm font-semibold text-gray-700">
                Cooked section
              </span>

              <button
                type="button"
                disabled={savingStorefront}
                onClick={() => updateCookedEnabled(!cookedEnabled)}
                className={`relative h-8 w-14 rounded-full transition ${
                  cookedEnabled ? "bg-green-500" : "bg-gray-300"
                } ${savingStorefront ? "opacity-60 cursor-wait" : ""}`}
                aria-label="Toggle cooked section"
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    cookedEnabled ? "left-7" : "left-1"
                  }`}
                />
              </button>

              <span
                className={`text-sm font-bold ${
                  cookedEnabled ? "text-green-700" : "text-gray-500"
                }`}
              >
                {cookedEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-semibold text-gray-500">
            Search item or category
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chicken, cooked, uncooked..."
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
          />
        </section>

        <div className="space-y-5">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            const isCookedCategory = category.trim().toLowerCase() === "cooked";
            const categoryDisabled = isCookedCategory && !cookedEnabled;

            return (
              <section
                key={category}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b bg-gray-50 px-4 py-3">
                  <div>
                    <h2 className="text-lg font-extrabold">{category}</h2>
                    <p className="text-xs text-gray-500">
                      {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {categoryDisabled && (
                    <span className="w-fit rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                      Coming soon on storefront
                    </span>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {categoryItems.map((item) => {
                    const saving = savingItemId === item._id;
                    const isOutOfStock = item.isOutOfStock === true;

                    return (
                      <div
                        key={item._id}
                        className="grid grid-cols-1 lg:grid-cols-[1fr_130px_130px_150px_120px] gap-3 px-4 py-4 items-center"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.imgUrl || "/placeholder.png"}
                            alt={item.name}
                            className="h-14 w-14 rounded-lg object-cover border border-gray-100 bg-gray-50"
                          />

                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate">
                              {item.name}
                            </div>
                            {item.desc && (
                              <div className="text-xs text-gray-500 line-clamp-2">
                                {item.desc}
                              </div>
                            )}
                            <div className="text-[11px] text-gray-400 font-mono mt-1">
                              {item._id}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500">
                            Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.priceDraft}
                            onChange={(e) =>
                              updateDraft(item._id, "priceDraft", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-500">
                            Old price
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.oldpriceDraft}
                            onChange={(e) =>
                              updateDraft(item._id, "oldpriceDraft", e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                            placeholder="Optional"
                          />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              updateItem(item, { isOutOfStock: !isOutOfStock })
                            }
                            className={`relative h-8 w-14 rounded-full transition ${
                              isOutOfStock ? "bg-red-500" : "bg-green-500"
                            } ${saving ? "opacity-60 cursor-wait" : ""}`}
                          >
                            <span
                              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                                isOutOfStock ? "left-7" : "left-1"
                              }`}
                            />
                          </button>

                          <span
                            className={`text-sm font-bold ${
                              isOutOfStock ? "text-red-700" : "text-green-700"
                            }`}
                          >
                            {isOutOfStock ? "Out" : "In stock"}
                          </span>
                        </label>

                        <button
                          onClick={() => savePrice(item)}
                          disabled={saving}
                          className={`rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm ${
                            saving
                              ? "bg-gray-300 cursor-wait"
                              : "bg-gradient-to-r from-[#fb923c] to-[#ef4444] hover:scale-[1.02] transition-transform"
                          }`}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
              No items found.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
