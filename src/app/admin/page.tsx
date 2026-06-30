"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

interface Booking {
  _id: string;
  customerPhone: string;
  busId: { _id: string; name: string } | null;
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

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ booking: Booking; amount: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = () => {
    setLoading(true);
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const unpaidConfirmed = confirmed.filter((b) => !b.isPaid);

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

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />

      <main className="lg:pl-56 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Pioneer bookings overview</p>
            </div>
            <button
              onClick={fetchBookings}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-2.5 sm:px-3 py-2 hover:bg-white transition-colors"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: "Pending", value: pending.length, color: "text-amber-600" },
              { label: "Confirmed", value: confirmed.length, color: "text-emerald-600" },
              { label: "Cancelled", value: cancelled.length, color: "text-red-500" },
              { label: "Unpaid", value: unpaidConfirmed.length, color: "text-orange-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5">
                <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-0.5`}>{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Link href="/admin/bookings" className="group bg-white rounded-xl border border-slate-100 p-4 sm:p-5 hover:border-pioneer-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-0.5">All Bookings</div>
                  <div className="text-xs text-slate-400 hidden sm:block">Filter and manage every booking</div>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-pioneer-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
            <Link href="/admin/buses" className="group bg-white rounded-xl border border-slate-100 p-4 sm:p-5 hover:border-pioneer-200 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-700 mb-0.5">Manage Buses</div>
                  <div className="text-xs text-slate-400 hidden sm:block">Add, edit, or deactivate buses</div>
                </div>
                <svg className="w-4 h-4 text-slate-300 group-hover:text-pioneer-600 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Pending bookings */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Pending Requests</h2>
              <Link href="/admin/bookings?status=pending" className="text-xs text-pioneer-600 hover:underline">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-pioneer-700 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : pending.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No pending requests</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {pending.slice(0, 8).map((booking) => (
                  <div key={booking._id} className="px-4 sm:px-5 py-3.5 sm:py-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 truncate">{booking.busId?.name || "Unknown Bus"}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusColors[booking.status]}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {booking.customerPhone} · {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setConfirmModal({ booking, amount: "" })}
                        disabled={actionLoading === booking._id}
                        className="flex-1 sm:flex-none text-xs bg-pioneer-700 text-white px-3 py-2 rounded-lg font-medium hover:bg-pioneer-800 transition-colors disabled:opacity-50 text-center"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateBooking(booking._id, { status: "cancelled" })}
                        disabled={actionLoading === booking._id}
                        className="flex-1 sm:flex-none text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 text-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-safe">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-6 pb-8 sm:pb-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Booking</h3>
            <p className="text-slate-500 text-sm mb-4">
              <strong>{confirmModal.booking.busId?.name}</strong> · {confirmModal.booking.customerPhone}
              <br />
              <span className="text-xs">{formatDate(confirmModal.booking.startDate)} → {formatDate(confirmModal.booking.endDate)}</span>
            </p>
            <div className="mb-5">
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
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleConfirm} className="flex-1 py-3 bg-pioneer-700 text-white rounded-xl text-sm font-semibold hover:bg-pioneer-800">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
