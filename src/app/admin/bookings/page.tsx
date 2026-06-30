"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

interface Bus { _id: string; name: string }
interface Booking {
  _id: string;
  customerPhone: string;
  busId: Bus | null;
  startDate: string;
  endDate: string;
  status: "pending" | "confirmed" | "cancelled";
  amount?: number;
  isPaid: boolean;
  createdAt: string;
}

function formatDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

function BookingsContent() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBus, setFilterBus] = useState(searchParams.get("busId") || "");
  const [filterStatus, setFilterStatus] = useState(searchParams.get("status") || "");
  const [filterPaid, setFilterPaid] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ booking: Booking; amount: string } | null>(null);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterBus) params.set("busId", filterBus);
    if (filterStatus) params.set("status", filterStatus);
    if (filterPaid !== "") params.set("isPaid", filterPaid);
    fetch(`/api/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .finally(() => setLoading(false));
  }, [filterBus, filterStatus, filterPaid]);

  useEffect(() => {
    fetch("/api/buses").then((r) => r.json()).then((d) => setBuses(d.buses || []));
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateBooking = async (id: string, update: Record<string, unknown>) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const data = await res.json();
      if (res.ok) {
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, ...data.booking } : b)));
      } else {
        alert(data.error || "Update failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    const amount = parseFloat(confirmModal.amount);
    if (isNaN(amount) || amount < 0) { alert("Enter a valid amount"); return; }
    await updateBooking(confirmModal.booking._id, { status: "confirmed", amount });
    setConfirmModal(null);
  };

  const hasFilters = filterBus || filterStatus || filterPaid;

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="lg:pl-56 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          <div className="mb-5 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Booking History</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">All booking requests and statuses</p>
          </div>

          {/* Filters — horizontally scrollable on mobile */}
          <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:flex-wrap scrollbar-none">
              <select
                value={filterBus}
                onChange={(e) => setFilterBus(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400 shrink-0 bg-white"
              >
                <option value="">All Buses</option>
                {buses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400 shrink-0 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filterPaid}
                onChange={(e) => setFilterPaid(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400 shrink-0 bg-white"
              >
                <option value="">Payment</option>
                <option value="true">Paid</option>
                <option value="false">Unpaid</option>
              </select>

              {hasFilters && (
                <button
                  onClick={() => { setFilterBus(""); setFilterStatus(""); setFilterPaid(""); }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2.5 py-2 rounded-lg hover:bg-slate-50 transition-colors shrink-0 whitespace-nowrap"
                >
                  Clear
                </button>
              )}

              <div className="ml-auto text-xs text-slate-400 flex items-center shrink-0 pl-2">
                {bookings.length} result{bookings.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-pioneer-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">No bookings found</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        {["Bus","Customer","Dates","Status","Amount","Payment","Created","Actions"].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {bookings.map((booking) => (
                        <tr key={booking._id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4 font-medium text-slate-800 whitespace-nowrap">{booking.busId?.name || "—"}</td>
                          <td className="px-5 py-4 text-slate-600 whitespace-nowrap">{booking.customerPhone}</td>
                          <td className="px-5 py-4 text-slate-600 whitespace-nowrap text-xs">
                            {formatDate(booking.startDate)}<br />→ {formatDate(booking.endDate)}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColors[booking.status]}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-medium whitespace-nowrap">
                            {booking.amount != null ? `₹${booking.amount.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-5 py-4">
                            {booking.status === "confirmed" ? (
                              <button
                                onClick={() => updateBooking(booking._id, { isPaid: !booking.isPaid })}
                                disabled={actionLoading === booking._id}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                                  booking.isPaid
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"
                                }`}
                              >
                                {booking.isPaid ? "✓ Paid" : "Unpaid"}
                              </button>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                            {new Date(booking.createdAt).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {booking.status === "pending" && (
                                <>
                                  <button onClick={() => setConfirmModal({ booking, amount: "" })} disabled={actionLoading === booking._id} className="text-xs bg-pioneer-700 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-pioneer-800 disabled:opacity-50">Confirm</button>
                                  <button onClick={() => updateBooking(booking._id, { status: "cancelled" })} disabled={actionLoading === booking._id} className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50">Cancel</button>
                                </>
                              )}
                              {booking.status === "confirmed" && (
                                <button onClick={() => updateBooking(booking._id, { status: "cancelled" })} disabled={actionLoading === booking._id} className="text-xs text-slate-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50">Cancel</button>
                              )}
                              {booking.status === "cancelled" && (
                                <button onClick={() => updateBooking(booking._id, { status: "pending" })} disabled={actionLoading === booking._id} className="text-xs text-slate-400 hover:text-pioneer-600 px-2 py-1.5 rounded-lg hover:bg-pioneer-50 disabled:opacity-50">Restore</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / tablet cards */}
                <div className="lg:hidden divide-y divide-slate-50">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800 truncate">{booking.busId?.name || "Unknown"}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{booking.customerPhone}</div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[booking.status]}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 mb-1">
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                        {booking.amount != null && <span className="font-medium text-slate-700">₹{booking.amount.toLocaleString()}</span>}
                        {booking.status === "confirmed" && (
                          <span className={`font-medium ${booking.isPaid ? "text-emerald-600" : "text-orange-500"}`}>
                            {booking.isPaid ? "· Paid" : "· Unpaid"}
                          </span>
                        )}
                        <span>{new Date(booking.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === "pending" && (
                          <>
                            <button onClick={() => setConfirmModal({ booking, amount: "" })} className="flex-1 text-xs bg-pioneer-700 text-white py-2 rounded-lg font-medium text-center">Confirm</button>
                            <button onClick={() => updateBooking(booking._id, { status: "cancelled" })} className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg font-medium text-center">Cancel</button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <>
                            <button onClick={() => updateBooking(booking._id, { isPaid: !booking.isPaid })} className={`flex-1 text-xs py-2 rounded-lg font-medium border ${booking.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-600 border-orange-200"}`}>
                              {booking.isPaid ? "Paid ✓" : "Mark Paid"}
                            </button>
                            <button onClick={() => updateBooking(booking._id, { status: "cancelled" })} className="text-xs text-slate-400 px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-500 border border-slate-200">Cancel</button>
                          </>
                        )}
                        {booking.status === "cancelled" && (
                          <button onClick={() => updateBooking(booking._id, { status: "pending" })} className="text-xs text-slate-500 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50">Restore</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Confirm modal — slides up from bottom on mobile */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-safe">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-5 pb-8 sm:pb-5">
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Booking</h3>
            <p className="text-slate-500 text-sm mb-4">
              {confirmModal.booking.busId?.name} · {confirmModal.booking.customerPhone}
              <br /><span className="text-xs">{formatDate(confirmModal.booking.startDate)} → {formatDate(confirmModal.booking.endDate)}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Agreed Amount (₹)</label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={confirmModal.amount}
                onChange={(e) => setConfirmModal((m) => m ? { ...m, amount: e.target.value } : m)}
                placeholder="e.g. 15000"
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">Cancel</button>
              <button onClick={handleConfirm} className="flex-1 py-3 bg-pioneer-700 text-white rounded-xl text-sm font-semibold hover:bg-pioneer-800">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pioneer-700 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookingsContent />
    </Suspense>
  );
}
