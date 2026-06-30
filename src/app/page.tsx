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

type Step = "cta" | "booking";

function formatDateLabel(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

const KERALA_ROUTES = ["🏔️ Munnar", "🌿 Wayanad", "🚢 Alleppey", "🐘 Thekkady", "🌴 Kovalam"];

const WHY_US = [
  { icon: "🛡️", title: "Safety First", desc: "Licensed drivers, serviced vehicles, every trip." },
  { icon: "❄️", title: "Full AC", desc: "Climate-controlled comfort regardless of weather." },
  { icon: "📍", title: "Any Route", desc: "Mountains, backwaters, pilgrimages — we go anywhere." },
  { icon: "📞", title: "24/7 Support", desc: "Always reachable before and during your journey." },
];

export default function Home() {
  const [step, setStep] = useState<Step>("cta");
  const [bus, setBus] = useState<Bus | null>(null);
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
      .then((d) => setBus(d.buses?.[0] ?? null))
      .finally(() => setBusLoading(false));
  }, []);

  useEffect(() => {
    if (!bus) return;
    setBlockedDates(new Set());
    fetch(`/api/bookings/blocked-dates?busId=${bus._id}`)
      .then((r) => r.json())
      .then((d) => setBlockedDates(new Set(d.blockedDates || [])));
  }, [bus]);

  const canSubmit =
    !!(bus && startDate && endDate && phone.replace(/[\s\-().+]/g, "").length >= 7);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId: bus!._id, customerPhone: phone, startDate, endDate }),
      });
      const data = await res.json();
      if (!res.ok) setSubmitError(data.error || "Submission failed. Please try again.");
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
    setStartDate(null);
    setEndDate(null);
    setPhone("");
    setSubmitError("");
  };

  // ─────────────────────────────────────────────────────────────────
  // BOOKING FLOW
  // ─────────────────────────────────────────────────────────────────
  if (step === "booking") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Light header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚌</span>
              <span className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Pioneer Bus Travels
              </span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Home
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14">
          <div className="max-w-5xl w-full">

            {/* Bus summary strip */}
            {bus && (
              <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-6 flex items-center gap-4 shadow-sm">
                <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  <Image src={bus.imageUrl} alt={bus.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{bus.name}</p>
                  <p className="text-xs text-slate-500">👥 {bus.capacity} seats · Full AC · WiFi</p>
                </div>
                <span className="hidden sm:flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available
                </span>
              </div>
            )}

            {/* Heading */}
            <div className="mb-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 mb-1">Book Your Charter</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Select Dates &amp; Your Contact
              </h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Tap a <strong>start date</strong>, then tap an <strong>end date</strong>. Multi-day bookings only.
              </p>
            </div>

            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl p-5 sm:p-8">
              <div className="grid lg:grid-cols-3 gap-6 items-start">

                {/* Calendar — 2 months */}
                <div className="lg:col-span-2 border border-slate-100 rounded-2xl p-4 sm:p-5 bg-slate-50/50">
                  <DateRangePicker
                    blockedDates={blockedDates}
                    onSelect={(s, e) => { setStartDate(s); setEndDate(e); }}
                    selectedStart={startDate}
                    selectedEnd={endDate}
                  />
                </div>

                {/* Side panel */}
                <div className="space-y-4">
                  {/* Summary card */}
                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Booking</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-base shrink-0">🚌</span>
                        <span className="font-semibold text-slate-800">{bus?.name ?? "—"}</span>
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

                  {/* Phone */}
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
                    <p className="text-[11px] text-slate-400 mt-1">We&apos;ll call you to confirm within minutes</p>
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
                <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h3>
              <p className="text-slate-500 text-sm mb-6">
                Your charter request has been submitted. Our team will call you within a few minutes to confirm the booking.
              </p>
              <button onClick={handleReset} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition-all">
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
          background: "linear-gradient(175deg, #bae6fd 0%, #38bdf8 18%, #0ea5e9 50%, #0284c7 78%, #075985 100%)",
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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xl">🚌</span>
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">Pioneer</span>
              </div>
              <div className="flex-1 text-center text-white/60 text-xs sm:text-sm font-semibold hidden xs:block">
                Kerala Bus Charters
              </div>
              <button
                onClick={() => setStep("booking")}
                className="bg-white text-slate-900 text-xs sm:text-sm font-bold px-4 py-2 rounded-full whitespace-nowrap hover:bg-white/95 transition-all shrink-0"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}
              >
                Book Now
              </button>
            </div>
          </nav>

          {/* Headline */}
          <div
            className={`text-center px-2 mb-6 sm:mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <h1 className="font-extrabold tracking-tight text-white leading-[0.92]"
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
              style={{ boxShadow: "0 30px 80px rgba(3,105,161,0.5), 0 0 0 1px rgba(255,255,255,0.1)" }}
            >
              {busLoading ? (
                <div className="w-full h-52 sm:h-64 bg-sky-600/40 animate-pulse" />
              ) : bus ? (
                <Image
                  src={bus.imageUrl}
                  alt="Pioneer Kerala tourist coach"
                  width={800}
                  height={460}
                  className="w-full h-52 sm:h-64 object-cover block"
                  priority
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#075985]/50 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#075985]/20 to-transparent" />
            </div>

            {/* Floating card — Bus Info (left) */}
            <div
              className="hidden sm:block absolute -left-10 top-6 w-44 bg-white rounded-2xl shadow-2xl p-3.5"
              style={{ transform: "rotate(-7deg)", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-1.5">Your Bus</p>
              <p className="text-sm font-extrabold text-slate-900 mb-2.5 leading-tight">
                {busLoading ? "Loading…" : (bus?.name ?? "Pioneer Royal Coach")}
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: "👥", label: `${bus?.capacity ?? 45} Seats` },
                  { icon: "❄️", label: "Full AC" },
                  { icon: "📶", label: "WiFi + USB" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <span className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center text-[11px] shrink-0">
                      {icon}
                    </span>
                    {label}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep("booking")}
                className="mt-3 w-full bg-slate-900 hover:bg-indigo-600 text-white text-[10px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                ⊕ Book This Bus
              </button>
            </div>

            {/* Floating card — Charter Duration (center bottom) */}
            <div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 bg-[#0c1a2e] rounded-2xl shadow-2xl p-4"
              style={{ transform: "translateX(-50%) rotate(2deg)", boxShadow: "0 20px 50px rgba(0,0,0,0.35)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Charter Duration</p>
              <div className="text-4xl font-extrabold text-white leading-none">1—30</div>
              <div className="text-indigo-400 text-sm font-bold mt-0.5">Days Available</div>
              <div className="text-[10px] text-slate-600 mt-1">Continuous multi-day hire</div>
            </div>

            {/* Floating card — Kerala Routes (right) */}
            <div
              className="hidden sm:block absolute -right-10 top-6 w-44 bg-white rounded-2xl shadow-2xl p-3.5"
              style={{ transform: "rotate(7deg)", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
            >
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-2">Kerala Routes</p>
              {KERALA_ROUTES.map((place) => (
                <div key={place} className="flex items-center gap-2 text-xs font-semibold text-slate-700 py-1 border-b border-slate-50 last:border-0">
                  <svg className="w-2.5 h-2.5 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  {place}
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle + CTA */}
          <div
            className={`text-center mt-16 sm:mt-14 mb-8 px-4 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <p className="text-white/65 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm mx-auto mb-6">
              Private multi-day bus charters across God&apos;s Own Country. Your group, your schedule, no compromises.
            </p>
            <button
              onClick={() => setStep("booking")}
              className="inline-flex items-center gap-2.5 bg-white text-slate-900 font-bold px-8 py-4 rounded-full shadow-2xl hover:bg-white/95 transition-all hover:-translate-y-0.5 text-sm sm:text-base"
              style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
            >
              Check Availability
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
            <p className="text-white/40 text-xs mt-3">Takes less than 2 minutes</p>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="bg-sky-600 py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee will-change-transform">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="text-white/90 font-bold text-xs tracking-[0.2em] uppercase shrink-0">
              {"KERALA CHARTER  ·  MUNNAR TOUR  ·  WAYANAD TRIP  ·  ALLEPPEY CRUISE  ·  THEKKADY SAFARI  ·  PRIVATE FLEET  ·  "}
            </span>
          ))}
        </div>
      </div>

      {/* ─── BUS DETAIL SECTION ─── */}
      <section className="bg-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Image */}
            <div className="relative">
              {busLoading ? (
                <div className="rounded-3xl bg-slate-100 animate-pulse h-72" />
              ) : bus ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200">
                  <Image
                    src={bus.imageUrl}
                    alt={bus.name}
                    width={700}
                    height={420}
                    className="w-full h-64 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Capacity badge */}
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-2xl px-4 py-2.5 shadow">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Capacity</div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">{bus.capacity}</div>
                    <div className="text-xs text-indigo-600 font-semibold">Passengers</div>
                  </div>
                </div>
              ) : null}

              {/* Decorative dot grid */}
              <div
                className="absolute -bottom-4 -right-4 w-28 h-28 opacity-20 hidden sm:block"
                style={{
                  backgroundImage: "radial-gradient(circle, #0ea5e9 1.5px, transparent 1.5px)",
                  backgroundSize: "14px 14px",
                }}
              />
            </div>

            {/* Details */}
            {bus && (
              <div>
                <p className="text-sky-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">Pioneer Royal Coach</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  Kerala&apos;s Most Comfortable Tourist Bus
                </h2>
                <p className="text-slate-500 leading-relaxed mb-7 text-base">{bus.description}</p>

                {/* Features grid */}
                <div className="grid grid-cols-2 gap-2 mb-8">
                  {bus.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3.5 py-2.5">
                      <svg className="w-4 h-4 text-sky-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-sm font-semibold text-slate-700">{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep("booking")}
                  className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold px-7 py-3.5 rounded-2xl transition-all hover:shadow-lg hover:shadow-sky-500/30"
                >
                  Book This Bus
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sky-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">Simple Process</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Book in 3 Easy Steps</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { n: "1", title: "Select Your Dates", desc: "Pick your start and end dates on the calendar. Multi-day charters available." },
              { n: "2", title: "Enter Your Number", desc: "Provide your WhatsApp number. We'll call you within minutes to confirm." },
              { n: "3", title: "Hit the Road", desc: "We handle the rest — pickup location, route, everything arranged for you." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="text-6xl font-extrabold text-slate-100 absolute -top-2 -right-2 leading-none select-none">
                  {n}
                </div>
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-extrabold text-lg mb-4">
                    {n}
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
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
            <p className="text-sky-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Why Pioneer</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for Kerala Tourism
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WHY_US.map((f) => (
              <div key={f.title} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-sky-500/20 transition-all group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section
        className="relative overflow-hidden py-20 sm:py-24"
        style={{ background: "linear-gradient(135deg, #0ea5e9, #0369a1 50%, #075985)" }}
      >
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
          backgroundSize: "48px 48px"
        }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <p className="text-sky-200 text-xs font-bold uppercase tracking-[0.2em] mb-4">Plan Your Trip</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
            Ready to Explore Kerala?
          </h2>
          <p className="text-sky-100/70 text-base mb-8 max-w-md mx-auto leading-relaxed">
            Submit your charter request in under 2 minutes. No payment needed upfront — we call you to confirm.
          </p>
          <button
            onClick={() => setStep("booking")}
            className="inline-flex items-center gap-2 bg-white text-sky-800 hover:bg-sky-50 font-bold px-8 py-4 rounded-full text-base shadow-2xl transition-all hover:-translate-y-0.5"
            style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
          >
            Check Bus Availability
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#040710] border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚌</span>
            <span className="font-bold text-white/70 text-sm">Pioneer Bus Travels</span>
          </div>
          <p className="text-white/25 text-xs text-center">
            &copy; {new Date().getFullYear()} Pioneer Bus Travels. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-white/30 font-medium">
            <span>Kerala Tourism</span>
            <span>·</span>
            <span>Private Charters</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
