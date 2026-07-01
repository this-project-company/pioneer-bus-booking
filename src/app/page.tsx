"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DateRangePicker } from "@/components/DateRangePicker";

interface Bus {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  features: string[];
  imageUrl: string;
  isActive: boolean;
}

type Step = "cta" | "bus" | "booking";

function formatDateLabel(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

const KERALA_ROUTES = [
  "Munnar Hills",
  "Wayanad",
  "Alleppey",
  "Thekkady",
  "Kovalam",
];

const WHY_US = [
  {
    icon: "📜",
    title: "Since 1947",
    desc: "75+ years of trusted service — one of Kerala's oldest travel companies.",
  },
  {
    icon: "🛕",
    title: "Pilgrimage Tours",
    desc: "Specialists in religious travel to temples, mosques, and churches across India.",
  },
  {
    icon: "🏢",
    title: "Corporate Travel",
    desc: "Reliable, punctual coaches for business groups and corporate events.",
  },
  {
    icon: "📞",
    title: "24/7 Support",
    desc: "Always reachable before and during every journey we operate.",
  },
];

function StepProgress({ current }: { current: 1 | 2 }) {
  const steps = ["Choose Bus", "Select Dates", "Confirm"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? (
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  idx
                )}
              </div>
              <span
                className={`text-xs font-bold hidden sm:block ${
                  active
                    ? "text-indigo-600"
                    : done
                      ? "text-emerald-600"
                      : "text-slate-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-2 ${done ? "bg-emerald-300" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Reusable logo mark used across landing and booking header */
function PioneerLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex  items-center gap-2.5">
      <div className="flex flex-col leading-none">
        <span
          className={`text-[1.35rem] leading-none tracking-wide ${dark ? "text-white" : "text-slate-900"}`}
          style={{ fontFamily: "var(--font-pacifico)" }}
        >
          Pioneer
        </span>
        <span
          className={`text-[8.5px] font-black tracking-[0.28em] uppercase leading-none mt-[3px] ${
            dark ? "text-white" : "text-slate-900"
          }`}
        >
          Holidays
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("cta");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [busLoading, setBusLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch("/api/buses?active=true")
      .then((r) => r.json())
      .then((d) => {
        const list: Bus[] = d.buses ?? [];
        setBuses(list);
        if (list.length > 0) setSelectedBus(list[0]);
      })
      .finally(() => setBusLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBus) return;
    setBlockedDates(new Set());
    fetch(`/api/bookings/blocked-dates?busId=${selectedBus._id}`)
      .then((r) => r.json())
      .then((d) => setBlockedDates(new Set(d.blockedDates || [])));
  }, [selectedBus]);

  const canSubmit = !!(
    selectedBus &&
    startDate &&
    endDate &&
    phone.replace(/[\s\-().+]/g, "").length >= 7
  );

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busId: selectedBus!._id,
          customerPhone: phone,
          startDate,
          endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        setSubmitError(data.error || "Submission failed. Please try again.");
      else setShowSuccess(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setStep("cta");
    setSelectedBus(null);
    setStartDate(null);
    setEndDate(null);
    setPhone("");
    setSubmitError("");
  };

  // Every CTA leads to bus selection first
  const openBusSelection = (preselect?: Bus) => {
    if (preselect) setSelectedBus(preselect);
    setStep("bus");
  };

  const heroBus = buses[0] ?? null;

  // ─────────────────────────────────────────────────────────────────
  // STEP 1 — BUS SELECTION
  // ─────────────────────────────────────────────────────────────────
  if (step === "bus") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <PioneerLogo dark />
            <button
              onClick={() => setStep("cta")}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Home
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
          <StepProgress current={1} />

          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 mb-1">
              Step 1 of 2
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Choose Your Coach
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {busLoading
                ? "Loading available buses…"
                : `${buses.length} vehicle${buses.length !== 1 ? "s" : ""} available · Select one to continue`}
            </p>
          </div>

          {busLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-slate-200 animate-pulse rounded-3xl h-80"
                />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {buses.map((b) => {
                const isSelected = selectedBus?._id === b._id;
                return (
                  <button
                    key={b._id}
                    onClick={() => setSelectedBus(b)}
                    className={`group text-left rounded-3xl overflow-hidden bg-white transition-all duration-200 focus:outline-none ${
                      isSelected
                        ? "ring-2 ring-indigo-600 shadow-xl shadow-indigo-100 -translate-y-1"
                        : "ring-1 ring-slate-200 hover:ring-indigo-300 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <Image
                        src={b.imageUrl}
                        alt={b.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-none">
                          Seats
                        </div>
                        <div className="text-xl font-black text-slate-900 leading-tight">
                          {b.capacity}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                          {b.name}
                        </h3>
                        {isSelected && (
                          <span className="shrink-0 text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs leading-relaxed mb-3.5 line-clamp-2">
                        {b.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {b.features.slice(0, 4).map((f) => (
                          <span
                            key={f}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                              isSelected
                                ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                                : "bg-slate-50 text-slate-600 border-slate-100"
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                        {b.features.length > 4 && (
                          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg border bg-slate-50 text-slate-400 border-slate-100">
                            +{b.features.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              {selectedBus
                ? `✓ ${selectedBus.name} selected`
                : "Tap a bus above to select it"}
            </p>
            <button
              onClick={() => {
                if (!selectedBus) return;
                setStartDate(null);
                setEndDate(null);
                setStep("booking");
              }}
              disabled={!selectedBus}
              className={`flex items-center gap-2 font-bold px-8 py-4 rounded-2xl text-sm transition-all ${
                selectedBus
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Continue to Booking
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // STEP 2 — DATE & CONTACT
  // ─────────────────────────────────────────────────────────────────
  if (step === "booking") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Light header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <PioneerLogo dark />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("bus")}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Change Bus
              </button>
              <span className="text-slate-200">|</span>
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
          <div className="max-w-5xl w-full">
            <StepProgress current={2} />

            {/* Selected bus summary */}
            {selectedBus && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
                <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  <Image
                    src={selectedBus.imageUrl}
                    alt={selectedBus.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedBus.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    👥 {selectedBus.capacity} seats · Full AC
                    {selectedBus.features.includes("Onboard WiFi")
                      ? " · WiFi"
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => setStep("bus")}
                  className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            {/* Heading */}
            <div className="mb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 mb-1">
                Step 2 of 2
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Select Dates &amp; Your Contact
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Tap a <strong>start date</strong>, then tap an{" "}
                <strong>end date</strong>. Multi-day bookings only.
              </p>
            </div>

            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl p-5 sm:p-8">
              <div className="grid lg:grid-cols-3 gap-6 items-start">
                {/* Calendar — 2 months */}
                <div className="lg:col-span-2 border border-slate-100 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <DateRangePicker
                    blockedDates={blockedDates}
                    onSelect={(s, e) => {
                      setStartDate(s);
                      setEndDate(e);
                    }}
                    selectedStart={startDate}
                    selectedEnd={endDate}
                  />
                </div>

                {/* Side panel */}
                <div className="space-y-4">
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Your Booking
                    </p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-base shrink-0">
                          🚌
                        </span>
                        <span className="font-semibold text-slate-800">
                          {selectedBus?.name ?? "—"}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border min-h-[36px] ${
                          startDate
                            ? "bg-white text-indigo-600 border-indigo-100"
                            : "bg-white/60 text-slate-400 border-slate-100"
                        }`}
                      >
                        {startDate && endDate
                          ? `📅 ${formatDateLabel(startDate)} → ${formatDateLabel(endDate)}`
                          : startDate
                            ? `🛫 From ${formatDateLabel(startDate)}`
                            : "No dates selected yet"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Your Phone Number
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      We&apos;ll call you to confirm within minutes
                    </p>
                  </div>

                  {submitError && (
                    <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      {submitError}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className={`w-full font-bold py-4 px-4 rounded-2xl transition-all text-sm ${
                      canSubmit && !submitting
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 cursor-pointer"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? "Submitting…" : "Request Booking"}
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    No payment required to submit a request
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Success modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Request Received!
              </h3>
              <p className="text-slate-500 text-sm mb-1">
                Your charter request has been submitted.
              </p>
              <p className="text-slate-500 text-sm mb-6">
                Our team will call you within a few minutes to confirm the
                booking.
              </p>
              <button
                onClick={handleReset}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-all"
              >
                Great, thanks!
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // LANDING PAGE
  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden flex flex-col"
        style={{
          background:
            "linear-gradient(175deg, #bae6fd 0%, #38bdf8 18%, #0ea5e9 50%, #0284c7 78%, #075985 100%)",
          minHeight: "100dvh",
        }}
      >
        {/* Cloud blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 left-10 w-72 h-32 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute top-6 right-8 w-96 h-28 bg-white/15 rounded-full blur-3xl" />
          <div className="absolute top-24 left-1/3 w-80 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#075985]/50 to-transparent" />
        </div>

        <div className="relative flex-1 flex flex-col max-w-4xl mx-auto px-4 w-full py-6">
          {/* Pill nav */}
          <nav className="flex justify-center mb-8 sm:mb-10">
            <div
              className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 sm:px-5 py-2.5 flex items-center gap-3 sm:gap-6 w-full max-w-lg"
              style={{ boxShadow: "0 4px 30px rgba(0,0,0,0.1)" }}
            >
              <PioneerLogo />
              <div className="flex-1 text-center text-slate-900 text-xs font-semibold hidden xs:block">
                Kerala Bus Charters
              </div>
              <button
                onClick={() => openBusSelection()}
                className="bg-white text-slate-900 text-xs sm:text-sm font-bold px-4 py-2 rounded-full whitespace-nowrap hover:bg-white/95 transition-all shrink-0"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
              >
                Book Now
              </button>
            </div>
          </nav>

          {/* Headline + heritage badge */}
          <div
            className={`text-center px-2 mb-6 sm:mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {/* Since 1947 badge */}
            <div className="flex justify-center mb-4">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <span className="text-amber-300 text-sm">★</span>
                <span className="text-white/90 text-xs font-bold tracking-wider uppercase">
                  Trusted Since 1947
                </span>
                <span className="text-amber-300 text-sm">★</span>
              </span>
            </div>

            <h1
              className="font-extrabold tracking-tight text-white leading-[0.92]"
              style={{ fontSize: "clamp(2.6rem, 8vw, 5rem)" }}
            >
              <span className="block">Kerala&apos;s Finest</span>
              <span className="block opacity-75">Tourist Bus</span>
              <span className="block">Charter</span>
            </h1>
          </div>

          {/* ── Central visual: bus image + floating cards ── */}
          <div
            className={`relative mx-auto w-full max-w-2xl transition-all duration-1000 delay-100 ${
              mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
            }`}
          >
            {/* Bus image card */}
            <div
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/20 animate-float"
              style={{
                boxShadow:
                  "0 30px 80px rgba(3,105,161,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
              }}
            >
              {busLoading ? (
                <div className="w-full h-52 sm:h-64 bg-sky-600/40 animate-pulse" />
              ) : heroBus ? (
                <Image
                  src={heroBus.imageUrl}
                  alt="Pioneer Holidays Kerala tourist coach"
                  width={800}
                  height={460}
                  className="w-full h-52 sm:h-64 object-cover block"
                  priority
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#075985]/50 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#075985]/20 to-transparent" />
            </div>

            {/* ── Floating card LEFT — Bus Specs ── */}
            <div
              className="hidden sm:block absolute -left-12 top-4 w-[170px] bg-white rounded-2xl overflow-hidden"
              style={{
                transform: "rotate(-7deg)",
                boxShadow:
                  "0 2px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.10), 0 24px 48px rgba(0,0,0,0.18)",
              }}
            >
              <div className="h-1.5 bg-gradient-to-r from-sky-400 to-indigo-500" />
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-sky-50 rounded-xl flex items-center justify-center text-sm shrink-0">
                      🚌
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight">
                      {busLoading
                        ? "Loading…"
                        : (heroBus?.name.replace("Pioneer ", "") ??
                          "Royal Coach")}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full shrink-0">
                    Active
                  </span>
                </div>

                <div className="mb-3">
                  <span className="text-[2.75rem] font-black text-slate-900 leading-none tracking-tight">
                    {heroBus?.capacity ?? 45}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-1">
                    seats
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 mb-3.5">
                  {["AC", "WiFi", "USB", "Panorama"].map((f) => (
                    <span
                      key={f}
                      className="text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-100 px-1.5 py-0.5 rounded-md"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => openBusSelection()}
                  className="w-full bg-slate-950 hover:bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-xl transition-colors"
                >
                  Book Now →
                </button>
              </div>
            </div>

            {/* ── Floating card CENTER — Heritage / Charter ── */}
            <div
              className="absolute -bottom-10 left-1/2 w-[190px] bg-[#0c1a2e] rounded-2xl overflow-hidden"
              style={{
                transform: "translateX(-50%) rotate(2deg)",
                boxShadow:
                  "0 4px 8px rgba(0,0,0,0.12), 0 12px 28px rgba(0,0,0,0.22), 0 32px 56px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              <div className="h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
              <div className="p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">
                  In Service Since
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-[2.8rem] font-black text-white leading-none tracking-tight">
                    1947
                  </span>
                </div>
                <p className="text-[11px] font-bold text-amber-400 mb-3">
                  75+ years of trust
                </p>
                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-300">
                    Available from today
                  </span>
                </div>
              </div>
            </div>

            {/* ── Floating card RIGHT — Kerala Routes ── */}
            <div
              className="hidden sm:block absolute -right-12 top-4 w-[170px] bg-white rounded-2xl overflow-hidden"
              style={{
                transform: "rotate(7deg)",
                boxShadow:
                  "0 2px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.10), 0 24px 48px rgba(0,0,0,0.18)",
              }}
            >
              <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-400" />
              <div className="p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                    Top Routes
                  </p>
                  <span className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full">
                    ★ 4.9
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 mb-3.5">
                  {KERALA_ROUTES.map((place) => (
                    <div
                      key={place}
                      className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0"
                    >
                      <svg
                        className="w-2.5 h-2.5 text-sky-500 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      <span className="text-[11px] font-semibold text-slate-700">
                        {place}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => openBusSelection()}
                  className="w-full text-center text-[10px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl py-1.5 transition-colors"
                >
                  View All Routes →
                </button>
              </div>
            </div>
          </div>

          {/* Subtitle + CTA */}
          <div
            className={`text-center mt-20 sm:mt-16 mb-8 px-4 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm mx-auto mb-6">
              Private multi-day bus charters across God&apos;s Own Country. Your
              group, your schedule — handled by Kerala&apos;s most trusted
              travel family.
            </p>
            <button
              onClick={() => openBusSelection()}
              className="inline-flex items-center gap-2.5 bg-white text-slate-900 font-bold px-8 py-4 rounded-full shadow-2xl hover:bg-white/95 transition-all hover:-translate-y-0.5 text-sm sm:text-base"
              style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
            >
              Check Availability
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <p className="text-white/40 text-xs mt-3">
              Takes less than 2 minutes · No payment upfront
            </p>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="bg-sky-600 py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee will-change-transform">
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              className="text-white/90 font-bold text-xs tracking-[0.2em] uppercase shrink-0"
            >
              {
                "TOURS & TRAVELS  ·  PILGRIMAGE TOURS  ·  HOLIDAY PACKAGES  ·  CORPORATE TRAVEL  ·  SINCE 1947  ·  KERALA  ·  "
              }
            </span>
          ))}
        </div>
      </div>

      {/* ─── OUR FLEET ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sky-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Our Fleet
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose Your Coach
            </h2>
            <p className="text-slate-500 text-base mt-3 max-w-md mx-auto">
              Three sizes, one standard of comfort. Every bus is fully AC,
              GPS-tracked, and driven by licensed professionals.
            </p>
          </div>

          {busLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-slate-100 animate-pulse rounded-3xl h-80"
                />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map((b) => (
                <div
                  key={b._id}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-100 hover:-translate-y-1 transition-all group"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <Image
                      src={b.imageUrl}
                      alt={b.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Seats
                      </span>
                      <div className="text-xl font-black text-slate-900 leading-none">
                        {b.capacity}
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-extrabold text-slate-900 text-lg mb-1.5">
                      {b.name}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
                      {b.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {b.features.slice(0, 4).map((f) => (
                        <span
                          key={f}
                          className="bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        >
                          {f}
                        </span>
                      ))}
                      {b.features.length > 4 && (
                        <span className="bg-slate-50 border border-slate-100 text-slate-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                          +{b.features.length - 4} more
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => openBusSelection(b)}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm py-3 rounded-2xl transition-all hover:shadow-lg hover:shadow-sky-500/30 flex items-center justify-center gap-2"
                    >
                      Book This Bus
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-sky-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              What We Offer
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Our Services
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                icon: "🗺️",
                title: "Tours & Travels",
                desc: "Scenic Kerala getaways and pan-India touring.",
              },
              {
                icon: "🛕",
                title: "Pilgrimage Tours",
                desc: "Sabari, Vaishno Devi, Ajmer, Tirupati and more.",
              },
              {
                icon: "🎁",
                title: "Holiday Packages",
                desc: "Curated packages for families and groups.",
              },
              {
                icon: "🏢",
                title: "Corporate Travel",
                desc: "On-time, reliable buses for business events.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white border border-slate-100 rounded-2xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sky-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Simple Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Book in 3 Easy Steps
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                n: "1",
                title: "Select Your Dates",
                desc: "Pick your start and end dates on the calendar. Multi-day charters available.",
              },
              {
                n: "2",
                title: "Enter Your Number",
                desc: "Provide your WhatsApp number. We'll call you within minutes to confirm.",
              },
              {
                n: "3",
                title: "Hit the Road",
                desc: "We handle the rest — pickup location, route, everything arranged for you.",
              },
            ].map(({ n, title, desc }) => (
              <div
                key={n}
                className="bg-slate-50 rounded-2xl p-6 border border-slate-100 relative overflow-hidden"
              >
                <div className="text-6xl font-extrabold text-slate-100 absolute -top-2 -right-2 leading-none select-none">
                  {n}
                </div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-extrabold text-lg mb-4">
                    {n}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY PIONEER ─── */}
      <section className="bg-[#070b14] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Why Pioneer Holidays
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Kerala&apos;s Most Trusted Travel Company
            </h2>
            <p className="text-white/40 text-sm mt-3">
              Since 1947 — three generations of service
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_US.map((f) => (
              <div
                key={f.title}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-amber-500/20 transition-all group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        className="relative overflow-hidden py-20 sm:py-24"
        style={{
          background: "linear-gradient(135deg, #0ea5e9, #0369a1 50%, #075985)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <p className="text-sky-200 text-xs font-bold uppercase tracking-[0.2em] mb-4">
            Plan Your Trip
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
            Ready to Explore Kerala?
          </h2>
          <p className="text-sky-100/70 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Submit your charter request in under 2 minutes. No payment needed
            upfront — we call you to confirm everything.
          </p>
          <button
            onClick={() => openBusSelection()}
            className="inline-flex items-center gap-2 bg-white text-sky-800 hover:bg-sky-50 font-bold px-8 py-4 rounded-full text-base shadow-2xl transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
          >
            Check Bus Availability
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#040710] border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Logo + tagline row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-2xl">🚌</span>
                <div>
                  <div
                    className="text-white text-2xl leading-none"
                    style={{ fontFamily: "var(--font-pacifico)" }}
                  >
                    Pioneer
                  </div>
                  <div className="text-white/40 text-[9px] font-black tracking-[0.3em] uppercase leading-none mt-1">
                    Holidays · Since 1947
                  </div>
                </div>
              </div>
              <p className="text-white/30 text-xs max-w-xs leading-relaxed hidden sm:block">
                Thank you for travelling with us.
                <br />
                Your trust drives us forward.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-1 text-xs text-white/30 font-medium text-right hidden sm:grid">
              {[
                "Tours & Travels",
                "Pilgrimage Tours",
                "Holiday Packages",
                "Corporate Travel",
              ].map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs text-center">
              &copy; {new Date().getFullYear()} Pioneer Holidays. All rights
              reserved.
            </p>
            <p className="text-white/20 text-xs italic sm:hidden text-center">
              Thank you for travelling with us. Your trust drives us forward.
            </p>
            <p className="text-white/20 text-xs">Kerala Tourism Registered</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
