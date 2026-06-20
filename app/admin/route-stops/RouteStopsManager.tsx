"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

interface Route {
  id: string;
  route_number: string;
  route_name: string;
}

interface Stop {
  id: string;
  name: string;
}

interface RouteStop {
  id: string;
  route_id: string;
  stop_id: string;
  sequence_order: number;
  eta_minutes_from_origin: number | null;
  stops: { id: string; name: string };
}

interface RouteStopsManagerProps {
  routes: Route[];
  stops: Stop[];
}

export function RouteStopsManager({ routes, stops }: RouteStopsManagerProps) {
  const router = useRouter();
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [addStopId, setAddStopId] = useState("");
  const [addEta, setAddEta] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRouteStops = useCallback(async (routeId: string) => {
    if (!routeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/route-stops?route_id=${routeId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch"); setRouteStops([]); return; }
      setRouteStops(data);
    } catch {
      setError("Network error");
      setRouteStops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRouteId) fetchRouteStops(selectedRouteId);
    else setRouteStops([]);
  }, [selectedRouteId, fetchRouteStops]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addStopId) { setError("Select a stop"); return; }
    setSaving(true);
    setError("");

    const maxOrder = routeStops.reduce((max, rs) => Math.max(max, rs.sequence_order), 0);

    try {
      const res = await fetch("/api/admin/route-stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_id: selectedRouteId,
          stop_id: addStopId,
          sequence_order: maxOrder + 1,
          eta_minutes_from_origin: addEta ? parseInt(addEta) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to add"); setSaving(false); return; }

      setShowAddForm(false);
      setAddStopId("");
      setAddEta("");
      fetchRouteStops(selectedRouteId);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveUp(rs: RouteStop, index: number) {
    if (index === 0) return;
    const above = routeStops[index - 1];

    try {
      await Promise.all([
        fetch(`/api/admin/route-stops/${rs.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence_order: above.sequence_order }),
        }),
        fetch(`/api/admin/route-stops/${above.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence_order: rs.sequence_order }),
        }),
      ]);
      fetchRouteStops(selectedRouteId);
      router.refresh();
    } catch {
      setError("Failed to reorder");
    }
  }

  async function handleMoveDown(rs: RouteStop, index: number) {
    if (index === routeStops.length - 1) return;
    const below = routeStops[index + 1];

    try {
      await Promise.all([
        fetch(`/api/admin/route-stops/${rs.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence_order: below.sequence_order }),
        }),
        fetch(`/api/admin/route-stops/${below.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sequence_order: rs.sequence_order }),
        }),
      ]);
      fetchRouteStops(selectedRouteId);
      router.refresh();
    } catch {
      setError("Failed to reorder");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this stop from the route?")) return;
    try {
      const res = await fetch(`/api/admin/route-stops/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      fetchRouteStops(selectedRouteId);
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  const usedStopIds = new Set(routeStops.map((rs) => rs.stop_id));
  const availableStops = stops.filter((s) => !usedStopIds.has(s.id));

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Route</label>
        <select
          value={selectedRouteId}
          onChange={(e) => { setSelectedRouteId(e.target.value); setShowAddForm(false); }}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a route...</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.route_number} — {r.route_name}</option>)}
        </select>
      </div>

      {selectedRouteId && (
        <>
          {loading ? (
            <p className="text-sm text-gray-400">Loading stops...</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">Stop</th>
                    <th className="px-4 py-3">ETA (min)</th>
                    <th className="px-4 py-3 text-right w-24">Reorder</th>
                    <th className="px-4 py-3 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routeStops.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No stops added to this route yet.</td></tr>
                  ) : routeStops.map((rs, index) => (
                    <tr key={rs.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{rs.stops?.name || "Unknown"}</td>
                      <td className="px-4 py-3 text-gray-600">{rs.eta_minutes_from_origin != null ? `${rs.eta_minutes_from_origin} min` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleMoveUp(rs, index)} disabled={index === 0} className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed" title="Move up"><ArrowUp className="w-4 h-4" /></button>
                          <button onClick={() => handleMoveDown(rs, index)} disabled={index === routeStops.length - 1} className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed" title="Move down"><ArrowDown className="w-4 h-4" /></button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(rs.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Remove"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showAddForm ? (
            <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Add Stop to Route</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stop *</label>
                  <select value={addStopId} onChange={(e) => setAddStopId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select stop...</option>
                    {availableStops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ETA from origin (min)</label>
                  <input type="number" min="0" value={addEta} onChange={(e) => setAddEta(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Adding..." : "Add"}</button>
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            </form>
          ) : (
            <button onClick={() => setShowAddForm(true)} disabled={availableStops.length === 0} className="self-start flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Stop
            </button>
          )}
        </>
      )}
    </div>
  );
}
