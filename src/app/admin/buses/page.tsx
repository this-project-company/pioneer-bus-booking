"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AdminNav } from "@/components/admin/AdminNav";

interface Bus {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  features: string[];
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface BusForm {
  name: string;
  description: string;
  capacity: string;
  featuresText: string;
  imageUrl: string;
  isActive: boolean;
}

const emptyForm: BusForm = {
  name: "",
  description: "",
  capacity: "",
  featuresText: "",
  imageUrl: "",
  isActive: true,
};

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [form, setForm] = useState<BusForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBuses = () => {
    setLoading(true);
    fetch("/api/buses")
      .then((r) => r.json())
      .then((d) => setBuses(d.buses || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBuses(); }, []);

  const openCreate = () => {
    setEditingBus(null);
    setForm(emptyForm);
    setPreviewUrl("");
    setError("");
    setShowForm(true);
  };

  const openEdit = (bus: Bus) => {
    setEditingBus(bus);
    setForm({
      name: bus.name,
      description: bus.description,
      capacity: String(bus.capacity),
      featuresText: bus.features.join(", "),
      imageUrl: bus.imageUrl,
      isActive: bus.isActive,
    });
    setPreviewUrl(bus.imageUrl);
    setError("");
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed"); setPreviewUrl(""); return; }
      setForm((f) => ({ ...f, imageUrl: data.url }));
      setPreviewUrl(data.url);
    } catch {
      setError("Upload failed. Please try again.");
      setPreviewUrl("");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Bus name is required"); return; }
    if (!form.description.trim()) { setError("Description is required"); return; }
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) < 1) {
      setError("Valid capacity is required"); return;
    }
    if (!form.imageUrl) { setError("Bus image is required"); return; }

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      capacity: Number(form.capacity),
      features: form.featuresText
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      imageUrl: form.imageUrl,
      isActive: form.isActive,
    };

    try {
      const res = await fetch(
        editingBus ? `/api/buses/${editingBus._id}` : "/api/buses",
        {
          method: editingBus ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed"); return; }

      setShowForm(false);
      fetchBuses();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (bus: Bus) => {
    await fetch(`/api/buses/${bus._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !bus.isActive }),
    });
    fetchBuses();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />

      <main className="lg:pl-56 pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-5 sm:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Bus Fleet</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Manage buses and availability</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 sm:gap-2 bg-pioneer-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-pioneer-800 transition-colors active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Bus
            </button>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
                  <div className="h-40 bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : buses.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 py-16 text-center">
              <p className="text-slate-400 text-sm mb-4">No buses yet</p>
              <button onClick={openCreate} className="text-pioneer-700 text-sm font-medium hover:underline">
                Add your first bus →
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {buses.map((bus) => (
                <div key={bus._id} className={`bg-white rounded-xl border overflow-hidden transition-all ${bus.isActive ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
                  <div className="relative h-40 bg-slate-100">
                    <Image
                      src={bus.imageUrl}
                      alt={bus.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${bus.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {bus.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{bus.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{bus.capacity} seats</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{bus.description}</p>
                    {bus.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {bus.features.slice(0, 3).map((f) => (
                          <span key={f} className="text-xs bg-pioneer-50 text-pioneer-700 px-2 py-0.5 rounded-full border border-pioneer-100">{f}</span>
                        ))}
                        {bus.features.length > 3 && <span className="text-xs text-slate-400">+{bus.features.length - 3}</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => openEdit(bus)}
                        className="flex-1 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg py-1.5 hover:bg-slate-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(bus)}
                        className={`flex-1 text-xs font-medium rounded-lg py-1.5 transition-colors ${
                          bus.isActive
                            ? "text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50"
                            : "text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        {bus.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bus Form Modal — full-screen sheet on mobile, centred dialog on sm+ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:px-4 sm:py-8 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg sm:my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingBus ? "Edit Bus" : "Add New Bus"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 -mr-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 pb-8">
              {/* Image */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bus Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-pioneer-400 hover:bg-pioneer-50/30 transition-all group"
                >
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="500px" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-pioneer-600">
                      <svg className="w-8 h-8 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="text-sm font-medium">Click to upload image</span>
                      <span className="text-xs mt-1">JPEG, PNG, WebP · Max 10MB</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-pioneer-700 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => { setPreviewUrl(""); setForm(f => ({ ...f, imageUrl: "" })); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-xs text-slate-400 hover:text-red-500 mt-1"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bus Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pioneer Royal Coach"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the bus, its purpose, and highlights…"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400 resize-none"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Seating Capacity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
                  placeholder="e.g. 45"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400"
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Features</label>
                <input
                  type="text"
                  value={form.featuresText}
                  onChange={(e) => setForm(f => ({ ...f, featuresText: e.target.value }))}
                  placeholder="Air Conditioning, WiFi, USB Charging, Restroom"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pioneer-500/20 focus:border-pioneer-400"
                />
                <p className="text-xs text-slate-400 mt-1">Comma-separated list of features</p>
              </div>

              {/* Active */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-semibold text-slate-700">Active</div>
                  <div className="text-xs text-slate-400">Visible to customers when active</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? "bg-pioneer-600" : "bg-slate-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3.5 py-3 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="flex-[2] flex items-center justify-center gap-2 bg-pioneer-700 hover:bg-pioneer-800 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
                >
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    editingBus ? "Save Changes" : "Add Bus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
