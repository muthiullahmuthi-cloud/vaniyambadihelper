"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import nextDynamic from "next/dynamic";
import { Pencil, Trash2, Plus, MapPin } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const LocationPicker = nextDynamic(() => import("./LocationPicker"), {
  ssr: false,
  loading: () => <div className="h-[250px] bg-gray-100 rounded-lg flex items-center justify-center"><LoadingSpinner /></div>,
});

interface Stop {
  id: string;
  name: string;
  name_local: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

interface StopsManagerProps {
  stops: Stop[];
}

export function StopsManager({ stops: initialStops }: StopsManagerProps) {
  const router = useRouter();
  const [stops, setStops] = useState<Stop[]>(initialStops);
  const [editing, setEditing] = useState<Stop | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [nameLocal, setNameLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  function resetForm() {
    setName("");
    setNameLocal("");
    setLatitude("");
    setLongitude("");
    setError("");
  }

  function startEdit(stop: Stop) {
    setEditing(stop);
    setName(stop.name);
    setNameLocal(stop.name_local || "");
    setLatitude(String(stop.latitude));
    setLongitude(String(stop.longitude));
    setShowAdd(false);
    setError("");
  }

  function startAdd() {
    setEditing(null);
    resetForm();
    setShowAdd(true);
    setError("");
  }

  function cancelForm() {
    setEditing(null);
    setShowAdd(false);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!name.trim()) { setError("Name is required"); setSaving(false); return; }
    if (isNaN(lat) || isNaN(lng)) { setError("Valid latitude and longitude are required"); setSaving(false); return; }

    try {
      const url = editing ? `/api/admin/stops/${editing.id}` : "/api/admin/stops";
      const method = editing ? "PUT" : "POST";
      const body = JSON.stringify({ name: name.trim(), name_local: nameLocal.trim() || null, latitude: lat, longitude: lng });

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }

      cancelForm();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this stop? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/stops/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setStops((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {(showAdd || editing) && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900">{editing ? "Edit Stop" : "Add New Stop"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Local Name</label>
              <input type="text" value={nameLocal} onChange={(e) => setNameLocal(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude *</label>
              <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude *</label>
              <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Click on map to set coordinates</p>
            <LocationPicker latitude={latitude} longitude={longitude} onLocationChange={(lat, lng) => { setLatitude(String(lat)); setLongitude(String(lng)); }} />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {!showAdd && !editing && (
        <button onClick={startAdd} className="self-start flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Stop
        </button>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Latitude</th>
              <th className="px-4 py-3">Longitude</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stops.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No stops yet.</td></tr>
            ) : stops.map((stop) => (
              <tr key={stop.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {stop.name}
                  {stop.name_local && <span className="text-gray-400 ml-2">({stop.name_local})</span>}
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono">{stop.latitude}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{stop.longitude}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(stop)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(stop.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
