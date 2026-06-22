"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle, Plus } from "lucide-react";

interface PowerWaterUpdate {
  id: string;
  type: "power_cut" | "water_supply";
  area: string;
  description: string;
  status: "active" | "resolved";
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

interface PowerWaterManagerProps {
  updates: PowerWaterUpdate[];
}

const TYPE_LABELS: Record<string, string> = {
  power_cut: "Power Cut",
  water_supply: "Water Supply",
};

const TYPE_COLORS: Record<string, string> = {
  power_cut: "bg-red-100 text-red-700",
  water_supply: "bg-blue-100 text-blue-700",
};

export function PowerWaterManager({ updates: initial }: PowerWaterManagerProps) {
  const router = useRouter();
  const [updates, setUpdates] = useState<PowerWaterUpdate[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<"power_cut" | "water_supply">("power_cut");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  function resetForm() {
    setType("power_cut");
    setArea("");
    setDescription("");
    setStartsAt("");
    setEndsAt("");
    setError("");
  }

  function toISTISO(datetimeLocal: string) {
    if (!datetimeLocal) return null;
    return new Date(datetimeLocal + "+05:30").toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!area.trim() || !description.trim() || !startsAt) {
      setError("Area, description, and start time are required");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/power-water", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          area: area.trim(),
          description: description.trim(),
          starts_at: toISTISO(startsAt),
          ends_at: toISTISO(endsAt),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }

      setUpdates((prev) => [data, ...prev]);
      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleResolve(item: PowerWaterUpdate) {
    setError("");
    try {
      const res = await fetch(`/api/admin/power-water/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setUpdates((prev) => prev.map((u) => u.id === item.id ? { ...u, status: "resolved" } : u));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this update permanently?")) return;
    try {
      const res = await fetch(`/api/admin/power-water/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setUpdates((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="self-start flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Update
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Add New Update</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value as "power_cut" | "water_supply")} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="power_cut">Power Cut</option>
                <option value="water_supply">Water Supply</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area *</label>
              <input type="text" value={area} onChange={(e) => setArea(e.target.value)} required placeholder="e.g. Bazaar Street" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts At *</label>
              <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends At</label>
              <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} placeholder="e.g. Scheduled maintenance 10am-2pm" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Starts</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {updates.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No updates yet.</td></tr>
            ) : updates.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-50 ${item.status === "resolved" ? "opacity-60" : ""}`}>
                <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[item.type]}`}>{TYPE_LABELS[item.type]}</span></td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.area}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.description}</td>
                <td className="px-4 py-3">{item.status === "active" ? <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Active</span> : <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600"><CheckCircle className="w-3 h-3" /> Resolved</span>}</td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(item.starts_at).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.status === "active" && (
                      <button onClick={() => handleResolve(item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="Mark Resolved"><CheckCircle className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
