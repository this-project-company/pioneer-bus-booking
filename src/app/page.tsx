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
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

const MARQUEE_TEXT =
  "PREMIUM CHARTER  ·  MULTI-DAY TOURS  ·  PRIVATE FLEET  ·  PROFESSIONAL DRIVERS  ·  SCENIC ROUTES  ·  KERALA TOURISM  ·  ";

const WHY_PIONEER = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Safety First",
    desc: "Vehicles maintained to the highest safety standards with licensed, experienced drivers on every trip.",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: "Climate Comfort",
    desc: "Fully air-conditioned coaches for a pleasant journey regardless of outside conditions.",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Flexible Scheduling",
    desc: "We work around your itinerary — multi-day hires, early departures, and late returns all accommodated.",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .91h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Our team is always reachable — before, during, and after your journey for complete peace of mind.",
  },
];

const STATS = [
  { num: "5+", label: "Luxury Buses" },
  { num: "55", label: "Max Seats" },
  { num: "10+", label: "Years Service" },
  { num: "500+", label: "Happy Groups" },
];

export default function Home() {
  const [step, setStep] = useState<Step>("cta");
  const [buses, setBuses] = useState<Bus[]>([]);
  const [busesLoading, setBusesLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch("/api/buses?active=true")
      .then((r) => r.json())
      .then((d) => setBuses(d.buses || []))
      .finally(() => setBusesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedBus) return;
    setBlockedDates(new Set());
    fetch(`/api/bookings/blocked-dates?busId=${selectedBus._id}`)
      .then((r) => r.json())
      .then((d) => setBlockedDates(new Set(d.blockedDates || [])));
  }, [selectedBus]);

  const canSubmit =
    !!(selectedBus && startDate && endDate && phone.replace(/[\s\-().+]/g, "").length >= 7);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ busId: selectedBus!._id, customerPhone: phone, startDate, endDate }),
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
    setSelectedBus(null);
    setStartDate(null);
    setEndDate(null);
    setPhone("");
    setSubmitError("");
  };

  const startBooking = (bus?: Bus) => {
    if (bus) {
      if (selectedBus?._id !== bus._id) { setStartDate(null); setEndDate(null); }
      setSelectedBus(bus);
      setStep("booking");
    } else {
      setStep("bus");
    }
  };

  const isDark = step === "cta";

  return (
    <div className="min-h-screen flex flex-col">

      {/* ─── HEADER ─── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          isDark
            ? "bg-[#070b14]/80 backdrop-blur-md border-b border-white/5"
            : "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚌</span>
            <span
              className={`font-bold text-lg sm:text-xl tracking-tight ${
                isDark
                  ? "text-white"
                  : "bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
              }`}
            >
              Pioneer Bus Travels
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isDark && (
              <button
                onClick={handleReset}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Home
              </button>
            )}
            <span
              className={`hidden sm:flex text-xs font-semibold px-3 py-1.5 rounded-full border items-center gap-1.5 ${
                isDark
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Available for Booking
            </span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          LANDING PAGE  (step === "cta")
      ═══════════════════════════════════════════════ */}
      {step === "cta" && (
        <>
          {/* ─── HERO ─── */}
          <section
            className="relative bg-[#070b14] overflow-hidden"
            style={{ minHeight: "calc(100vh - 64px)" }}
          >
            {/* Background grid */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "64px 64px",
              }}
            />

            {/* Glow blobs */}
            <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-700/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-20 flex items-center min-h-[calc(100vh-64px)]">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">

                {/* ── Left: Copy ── */}
                <div
                  className={`transition-all duration-700 ease-out ${
                    mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-1.5 mb-7">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.15em]">
                      Premium Charter Service
                    </span>
                  </div>

                  {/* H1 */}
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95] mb-6">
                    <span className="block text-white">Travel</span>
                    <span className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">
                      Premium.
                    </span>
                    <span className="block text-white/60">Together.</span>
                  </h1>

                  <p className="text-base sm:text-lg text-white/45 leading-relaxed mb-9 max-w-md">
                    Private multi-day bus charters across Kerala and beyond. Your whole group, one bus, zero compromises.
                  </p>

                  {/* CTAs */}
                  <div className="flex flex-wrap gap-3 mb-10">
                    <button
                      onClick={() => startBooking()}
                      className="group inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-4 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                    >
                      Book Your Charter
                      <svg
                        className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                    <a
                      href="#fleet"
                      className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-white/80 font-semibold px-7 py-4 rounded-2xl transition-all duration-300"
                    >
                      Explore Fleet
                    </a>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-7 flex-wrap">
                    {STATS.map(({ num, label }) => (
                      <div key={label}>
                        <div className="text-2xl font-extrabold text-white">{num}</div>
                        <div className="text-[11px] text-white/35 font-semibold uppercase tracking-wider mt-0.5">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right: Bus visual ── */}
                <div
                  className={`relative transition-all duration-1000 ease-out delay-200 ${
                    mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
                  }`}
                >
                  {/* Glow layers */}
                  <div className="absolute inset-4 bg-indigo-600/20 rounded-3xl blur-3xl pointer-events-none" />
                  <div className="absolute inset-10 bg-violet-500/15 rounded-3xl blur-2xl pointer-events-none" />

                  {/* Floating bus */}
                  <div className="relative animate-float">
                    {/* Main bus card */}
                    <div
                      className="relative rounded-3xl overflow-hidden"
                      style={{
                        transform: "perspective(1400px) rotateY(-8deg) rotateX(5deg)",
                        boxShadow:
                          "0 50px 120px rgba(99,102,241,0.4), 0 20px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      <Image
                        src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&h=720&fit=crop"
                        alt="Pioneer luxury coach bus"
                        width={700}
                        height={420}
                        className="w-full h-auto block"
                        priority
                      />
                      {/* Gradient overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14]/70 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/30 to-transparent" />
                    </div>

                    {/* Floating badge — capacity */}
                    <div
                      className="absolute -top-5 -left-4 sm:-left-10 bg-[#0e1629]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-2xl"
                      style={{ animation: "float 7s ease-in-out infinite 1s" }}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35 mb-1">
                        Max Capacity
                      </div>
                      <div className="text-3xl font-extrabold text-white leading-none">55</div>
                      <div className="text-xs text-indigo-400 font-semibold mt-0.5">Passengers</div>
                    </div>

                    {/* Floating badge — amenities */}
                    <div
                      className="absolute -bottom-5 -right-4 sm:-right-10 bg-[#0e1629]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3 sm:p-4 shadow-2xl"
                      style={{ animation: "float 8s ease-in-out infinite 0.5s" }}
                    >
                      <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35 mb-2">
                        Amenities
                      </div>
                      <div className="flex gap-1.5">
                        {["AC", "WiFi", "USB", "Recline"].map((a) => (
                          <span
                            key={a}
                            className="bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-lg"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Live badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/25 rounded-full px-3 py-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400">Available</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#070b14] to-transparent pointer-events-none" />
          </section>

          {/* ─── MARQUEE ─── */}
          <div className="bg-indigo-600 py-3 overflow-hidden">
            <div className="flex whitespace-nowrap animate-marquee will-change-transform">
              {[...Array(4)].map((_, i) => (
                <span key={i} className="text-white/90 font-bold text-xs tracking-[0.2em] uppercase shrink-0">
                  {MARQUEE_TEXT}
                </span>
              ))}
            </div>
          </div>

          {/* ─── FLEET SECTION ─── */}
          <section id="fleet" className="bg-white py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-14">
                <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">Our Fleet</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  Choose Your Perfect Bus
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto text-base leading-relaxed">
                  From intimate group trips to large-scale events — we have the right vehicle for every occasion.
                </p>
              </div>

              {busesLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-3xl bg-slate-100 animate-pulse h-80" />
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {buses.map((bus) => (
                    <div
                      key={bus._id}
                      className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 transition-all duration-500 hover:-translate-y-2 flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden bg-slate-100">
                        <Image
                          src={bus.imageUrl}
                          alt={bus.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="bg-white/95 backdrop-blur text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow">
                            {bus.capacity} Seats
                          </span>
                          <span className="bg-indigo-600/90 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                            Private Charter
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-slate-900 mb-1.5">{bus.name}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
                          {bus.description}
                        </p>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {bus.features.slice(0, 3).map((f) => (
                            <span
                              key={f}
                              className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg"
                            >
                              {f}
                            </span>
                          ))}
                          {bus.features.length > 3 && (
                            <span className="text-[11px] font-semibold bg-slate-100 text-slate-400 px-2.5 py-1 rounded-lg">
                              +{bus.features.length - 3}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => startBooking(bus)}
                          className="w-full bg-slate-900 group-hover:bg-indigo-600 text-white text-sm font-bold py-3 rounded-2xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/25"
                        >
                          Book This Bus →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ─── WHY PIONEER ─── */}
          <section className="bg-[#070b14] py-20 sm:py-28">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-14">
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Why Pioneer</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
                  Engineered for Comfort
                </h2>
                <p className="text-white/35 max-w-lg mx-auto text-base leading-relaxed">
                  Every journey with Pioneer is planned to perfection — from departure to destination.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {WHY_PIONEER.map((f) => (
                  <div
                    key={f.title}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-indigo-500/20 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:bg-indigo-600/25 transition-colors">
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-sm text-white/35 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── SECONDARY BUS SHOWCASE ─── */}
          <section className="bg-slate-50 py-20 sm:py-28 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-indigo-600 text-xs font-bold uppercase tracking-[0.2em] mb-3">Multi-Day Charters</p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 tracking-tight">
                    Your Group, Your Schedule, Your Bus
                  </h2>
                  <p className="text-slate-500 leading-relaxed mb-6">
                    Whether it&apos;s a 3-day pilgrimage, a corporate retreat, or a family reunion — we assign the whole bus exclusively to your group for the entire duration.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "No shared seats — your group only",
                      "Continuous multi-day hire available",
                      "Pick-up and drop at your preferred locations",
                      "Competitive per-day pricing",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => startBooking()}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                  >
                    Request a Quote
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Stacked bus images */}
                <div className="relative hidden lg:block h-[420px]">
                  {buses[1] && (
                    <div className="absolute top-0 right-0 w-4/5 rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200">
                      <Image
                        src={buses[1].imageUrl}
                        alt={buses[1].name}
                        width={500}
                        height={300}
                        className="w-full h-52 object-cover"
                      />
                    </div>
                  )}
                  {buses[0] && (
                    <div className="absolute bottom-0 left-0 w-4/5 rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200">
                      <Image
                        src={buses[0].imageUrl}
                        alt={buses[0].name}
                        width={500}
                        height={300}
                        className="w-full h-52 object-cover"
                      />
                    </div>
                  )}
                  {/* Decorative dot grid */}
                  <div
                    className="absolute -bottom-4 -right-4 w-32 h-32 opacity-30"
                    style={{
                      backgroundImage: "radial-gradient(circle, #6366f1 1.5px, transparent 1.5px)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ─── CTA SECTION ─── */}
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 py-20 sm:py-24">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-3xl mx-auto px-4 text-center">
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-[0.2em] mb-4">Book Now</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 tracking-tight">
                Ready to Plan Your<br className="hidden sm:block" /> Group Journey?
              </h2>
              <p className="text-indigo-100/80 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                Select your bus, pick your dates, and submit your request in under 2 minutes.
              </p>
              <button
                onClick={() => startBooking()}
                className="group inline-flex items-center gap-3 bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 py-4 rounded-2xl text-base sm:text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-900/30 hover:-translate-y-0.5"
              >
                Start Booking
                <svg
                  className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <p className="text-indigo-200/60 text-xs mt-4">No payment required to submit a request</p>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="bg-[#040710] border-t border-white/5 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚌</span>
                <span className="font-bold text-white/70 text-sm">Pioneer Bus Travels</span>
              </div>
              <p className="text-white/25 text-xs text-center">
                &copy; {new Date().getFullYear()} Pioneer Bus Travels. All rights reserved.
              </p>
              <div className="flex gap-4 text-xs text-white/30 font-medium">
                <span>Private Charters</span>
                <span>·</span>
                <span>Kerala &amp; Beyond</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* ═══════════════════════════════════════════════
          BOOKING FLOW  (step !== "cta")
      ═══════════════════════════════════════════════ */}
      {step !== "cta" && (
        <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-14 bg-slate-50">
          <div className="max-w-4xl w-full">

            {/* Step heading */}
            <div className="mb-8 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600 mb-2">
                {step === "bus" ? "Step 1 of 3" : "Step 2 & 3"}
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                {step === "bus" ? "Choose Your Bus" : "Select Dates & Contact"}
              </h1>
              <p className="text-slate-500 text-sm">
                {step === "bus"
                  ? "Pick the vehicle that best suits your group size."
                  : "Confirm your travel dates and phone number."}
              </p>
            </div>

            <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/50 rounded-3xl p-5 sm:p-8">

              {/* ── Bus selection ── */}
              {step === "bus" && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {buses.map((bus) => (
                      <div
                        key={bus._id}
                        onClick={() => {
                          if (selectedBus?._id !== bus._id) { setStartDate(null); setEndDate(null); }
                          setSelectedBus(bus);
                        }}
                        className={`border-2 rounded-2xl p-5 cursor-pointer transition-all flex flex-col ${
                          selectedBus?._id === bus._id
                            ? "border-indigo-600 bg-indigo-50/30 shadow-md shadow-indigo-100"
                            : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="relative h-36 rounded-xl overflow-hidden mb-4 bg-slate-100">
                          <Image
                            src={bus.imageUrl}
                            alt={bus.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                          {selectedBus?._id === bus._id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow">
                              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{bus.name}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 flex-1">{bus.description}</p>
                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap text-xs font-medium text-slate-600">
                          <span>👥 {bus.capacity} Seats</span>
                          {bus.features.slice(0, 2).map((f) => (
                            <span key={f} className="bg-slate-100 px-2 py-0.5 rounded-md">{f}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => selectedBus && setStep("booking")}
                      disabled={!selectedBus}
                      className={`font-semibold px-6 py-3 rounded-xl transition-all ${
                        selectedBus
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 cursor-pointer"
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Continue to Dates →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Date + contact ── */}
              {step === "booking" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-5 gap-5 sm:gap-6 items-start">
                    {/* Calendar */}
                    <div className="md:col-span-3 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                      <DateRangePicker
                        blockedDates={blockedDates}
                        onSelect={(s, e) => { setStartDate(s); setEndDate(e); }}
                        selectedStart={startDate}
                        selectedEnd={endDate}
                      />
                    </div>

                    {/* Side panel */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Your Selection</p>
                        <p className="font-semibold text-slate-800 text-sm">{selectedBus?.name}</p>
                        <p className="text-xs font-semibold text-indigo-600 bg-white p-2.5 rounded-lg border border-indigo-100 min-h-[36px] flex items-center">
                          {startDate && endDate
                            ? `📅 ${formatDateLabel(startDate)} → ${formatDateLabel(endDate)}`
                            : startDate
                            ? `🛫 Start: ${formatDateLabel(startDate)}`
                            : "No dates selected yet."}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          inputMode="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your mobile number"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                        />
                      </div>

                      {submitError && (
                        <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {submitError}
                        </p>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all text-center text-sm ${
                          canSubmit && !submitting
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 cursor-pointer"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {submitting ? "Submitting…" : "Request Booking"}
                      </button>

                      <button
                        onClick={() => setStep("bus")}
                        className="w-full text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-all text-center block"
                      >
                        ← Change Bus Choice
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      )}

      {/* ─── SUCCESS MODAL ─── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h3>
            <p className="text-slate-500 text-sm mb-6">
              Your charter booking request has been submitted. Our team will call you within a few minutes to confirm arrangements.
            </p>
            <button
              onClick={handleReset}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
