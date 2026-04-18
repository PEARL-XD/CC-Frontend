import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import axios from "axios";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LIMIT = 20;

/* ── Constants ─────────────────────────────────────────────────────── */

const ISSUE_LABEL = {
  MISSING_ITEM:   "Missing item",
  WRONG_ITEM:     "Wrong cut / item",
  SHORT_WEIGHT:   "Short weight",
  NOT_FRESH:      "Not fresh / bad smell",
  POOR_PACKAGING: "Poor packaging",
  LATE_DELIVERY:  "Late delivery",
  POOR_QUALITY:   "Poor quality / taste",
  WRONG_CHARGE:   "Wrong charge",
  OTHER:          "Other",
};

const TICKET_STATUS_OPTIONS = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];

const STATUS_STYLE = {
  OPEN:      { pill: "bg-amber-100 text-amber-800",  label: "Open" },
  IN_REVIEW: { pill: "bg-blue-100 text-blue-800",    label: "In Review" },
  RESOLVED:  { pill: "bg-green-100 text-green-800",  label: "Resolved" },
  CLOSED:    { pill: "bg-gray-100 text-gray-600",    label: "Closed" },
};

const PRIORITY_STYLE = {
  High:   { pill: "bg-red-50 text-red-800 border border-red-200",       dot: "🔴" },
  Medium: { pill: "bg-amber-50 text-amber-800 border border-amber-200", dot: "🟡" },
  Low:    { pill: "bg-green-50 text-green-800 border border-green-200", dot: "🟢" },
};

const FILTER_TABS = [
  { key: "ALL",       label: "All" },
  { key: "OPEN",      label: "Open" },
  { key: "IN_REVIEW", label: "In Review" },
  { key: "RESOLVED",  label: "Resolved" },
  { key: "CLOSED",    label: "Closed" },
];

/* ── Helpers ───────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(name = "") {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-800",
  "bg-teal-100 text-teal-800",
  "bg-pink-100 text-pink-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
];

function avatarColor(name = "") {
  const code = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE ROOT
══════════════════════════════════════════════════════════════════════ */

export default function AdminSupportPage() {
  const { accessToken } = useContext(AuthContext);

  const [tickets,    setTickets]    = useState([]);
  const [summary,    setSummary]    = useState({ open: 0, inReview: 0, resolved: 0, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search,        setSearch]       = useState("");
  const [searchInput,   setSearchInput]  = useState("");

  // Debounce search
  const debounceRef = useRef(null);
  const handleSearchInput = (val) => {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(val), 400);
  };

  const fetchTickets = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: LIMIT };
      if (filterStatus !== "ALL") params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const { data } = await axios.get(`${API_BASE_URL}/api/admin/support`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
console.log("API response:", data);
      setTickets(data.tickets || []);
      setSummary(data.summary || {});
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterStatus, search]);

  // Re-fetch whenever filter or search changes
  useEffect(() => { fetchTickets(1); }, [fetchTickets]);

  const handleStatusUpdate = (ticketId, newStatus) => {
    // Optimistically update UI, then persist
    setTickets((prev) =>
      prev.map((t) => (t._id === ticketId ? { ...t, status: newStatus, _saving: true } : t))
    );

    axios
      .patch(
        `${API_BASE_URL}/api/admin/support/${ticketId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      .then(() => {
        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? { ...t, _saving: false, _saved: true } : t))
        );
        // Refresh summary counts
        fetchTickets(pagination.page);
      })
      .catch(() => {
        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? { ...t, _saving: false, _error: true } : t))
        );
      });
  };

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Header */}
        <div className="py-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold">Support tickets</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage and respond to customer queries
            </p>
          </div>
          <button
            onClick={() => fetchTickets(pagination.page)}
            className="text-sm px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
         {[
  { label: "Open",      value: summary.open,     color: "text-amber-600" },
  { label: "In review", value: summary.inReview, color: "text-blue-600"  }, // ← inReview not in_review
  { label: "Resolved",  value: summary.resolved, color: "text-green-600" },
  { label: "Total",     value: summary.total,    color: "text-gray-800"  },
].map(({ label, value, color }) => (
  <div key={label} className="bg-gray-50 rounded-xl p-4">
    <div className={`text-2xl font-extrabold ${color}`}>
      {value ?? "—"}   {/* ?? "—" shows a dash if undefined, helps you spot the mismatch */}
    </div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
))}
        </div>

        {/* Filters + search */}
        <div className="flex gap-2 flex-wrap items-center mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search by name or phone…"
            className="flex-1 min-w-44 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400"
          />
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                filterStatus === key
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
              {key === "OPEN"      && summary.open      > 0 && (
                <span className="ml-1.5 text-xs bg-white text-indigo-600 rounded-full px-1.5">
                  {summary.open}
                </span>
              )}
              {key === "IN_REVIEW" && summary.inReview  > 0 && (
                <span className="ml-1.5 text-xs bg-white text-indigo-600 rounded-full px-1.5">
                  {summary.inReview}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => fetchTickets(pagination.page)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🎧</div>
            <p className="text-sm">No tickets match this filter.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <AdminTicketCard
                key={ticket._id}
                ticket={ticket}
                 accessToken={accessToken}
                onStatusChange={handleStatusUpdate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => fetchTickets(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchTickets(p)}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  p === pagination.page
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchTickets(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}

        {!loading && pagination.total > 0 && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Showing {tickets.length} of {pagination.total} tickets
          </p>
        )}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ADMIN TICKET CARD
══════════════════════════════════════════════════════════════════════ */

// AdminSupportPage.jsx — just the AdminTicketCard component, fully corrected
// The rest of AdminSupportPage.jsx stays exactly as written above.

function AdminTicketCard({ ticket, accessToken, onStatusChange }) {
  const [localStatus, setLocalStatus] = useState(ticket.status);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [saveError,   setSaveError]   = useState(false);
  const [expanded,    setExpanded]    = useState(
    ticket.status === "OPEN" || ticket.status === "IN_REVIEW"
  );

  useEffect(() => { setLocalStatus(ticket.status); }, [ticket.status]);

  const user       = ticket.user  || {};
  const order      = ticket.order || {};
  const orderItems = order.items  || [];

  const statusStyle   = STATUS_STYLE[localStatus]       || STATUS_STYLE.OPEN;
  const priorityStyle = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.Medium;
  const issueLabel    = ISSUE_LABEL[ticket.issueType]   || ticket.issueType;
  const av            = avatarColor(user.name);

  // ── accessToken comes in as a prop now, no useContext here ──
  const handleSave = async () => {
    if (localStatus === ticket.status) return; // nothing changed, skip
    setSaving(true);
    setSaved(false);
    setSaveError(false);
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/support/${ticket._id}/status`,
        { status: localStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onStatusChange(ticket._id, localStatus); // tell parent to refresh summary counts
    } catch {
      setSaveError(true);
      setLocalStatus(ticket.status); // revert dropdown back on failure
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
      localStatus === "OPEN" ? "border-amber-200" : "border-gray-200"
    }`}>

      {/* ── Header row — always visible, click to expand/collapse ── */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${av}`}>
            {initials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 text-sm">{user.name || "Unknown"}</span>
              <span className="text-xs text-gray-400">{user.tower} / {user.flat}</span>
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {issueLabel} · Order #{order._id?.slice(-8) ?? "—"} · {formatDate(ticket.createdAt)}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityStyle.pill}`}>
              {priorityStyle.dot} {ticket.priority}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusStyle.pill}`}>
              {statusStyle.label}
            </span>
            <span className="text-gray-400 text-sm ml-1">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">

          {/* Customer contact info */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-xs text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-800">{user.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm text-gray-700">{user.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm text-gray-700">Tower {user.tower}, Flat {user.flat}</p>
            </div>
          </div>

          {/* What the customer wrote */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Customer's description
            </p>
            <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-3">
              {ticket.description}
            </p>
          </div>

          {/* Items in the order */}
          {orderItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Order details · ₹{order.totalAmount?.toFixed(0)} ·{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                {orderItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex-1 truncate">{item.name}</span>
                    <span className="text-gray-400 mx-3">×{item.quantity}</span>
                    <span className="font-semibold text-gray-800">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status update */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Update status
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={localStatus}
                onChange={(e) => {
                  setLocalStatus(e.target.value);
                  setSaved(false);
                  setSaveError(false);
                }}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 bg-white"
              >
                {TICKET_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_STYLE[s]?.label || s}</option>
                ))}
              </select>

              <button
                onClick={handleSave}
                disabled={saving || localStatus === ticket.status}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 ${
                  localStatus === "RESOLVED" ? "bg-green-600 hover:bg-green-700 text-white" :
                  localStatus === "CLOSED"   ? "bg-gray-600 hover:bg-gray-700 text-white"  :
                                               "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {saving ? "Saving…" : "Save"}
              </button>

              {saved     && <span className="text-xs text-green-600 font-semibold">✓ Saved</span>}
              {saveError && <span className="text-xs text-red-500">Failed — try again</span>}

              {user.phone && (
                <a>
                  href={`tel:${user.phone}`}
                  className="ml-auto text-sm text-indigo-600 font-semibold hover:underline"
                
                  Call {user.phone}
                </a>
              )}
            </div>

            {/* Only show this hint when you're about to mark as resolved */}
            {localStatus === "RESOLVED" && localStatus !== ticket.status && (
              <p className="text-xs text-gray-400 mt-2">
                An email will be sent to the customer when you save.
              </p>
            )}
          </div>

          <p className="text-xs text-gray-300">
            Ticket ref: <span className="font-mono">#{ticket._id.slice(-12)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
