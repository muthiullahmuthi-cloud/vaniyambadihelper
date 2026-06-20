"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Stop {
  id: string;
  name: string;
}

interface RouteStop {
  name: string;
}

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  route_type: "local" | "intercity";
  origin_stop_id: string;
  destination_stop_id: string;
  direction_group: string | null;
  origin: RouteStop | null;
  destination: RouteStop | null;
}

interface RoutesManagerProps {
  routes: Route[];
  stops: Stop[];
}

export function RoutesManager({ routes: initialRoutes, stops }: RoutesManagerProps) {
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>(initialRoutes);
  const [editing, setEditing] = useState<Route | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [routeNumber, setRouteNumber] = useState("");
  const [routeName, setRouteName] = useState("");
  const [routeType, setRouteType] = useState<"local" | "intercity">("local");
  const [originStopId, setOriginStopId] = useState("");
  const [destinationStopId, setDestinationStopId] = useState("");
  const [directionGroup, setDirectionGroup] = useState("");

  function resetForm() {
    setRouteNumber("");
    setRouteName("");
    setRouteType("local");
    setOriginStopId("");
    setDestinationStopId("");
    setDirectionGroup("");
    setError("");
  }

  function startEdit(route: Route) {
    setEditing(route);
    setRouteNumber(route.route_number);
    setRouteName(route.route_name);
    setRouteType(route.route_type);
    setOriginStopId(route.origin_stop_id);
    setDestinationStopId(route.destination_stop_id);
    setDirectionGroup(route.direction_group || "");
    setShowAdd(false);
    setError("");
  }

  function startAdd() {
    setEditing(null);
    resetForm();
    setShowAdd(true);
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

    if (!routeNumber.trim()) { setError("Route number is required"); setSaving(false); return; }
    if (!routeName.trim()) { setError("Route name is required"); setSaving(false); return; }
    if (!originStopId) { setError("Origin stop is required"); setSaving(false); return; }
    if (!destinationStopId) { setError("Destination stop is required"); setSaving(false); return; }

    try {
      const url = editing ? `/api/admin/routes/${editing.id}` : "/api/admin/routes";
      const method = editing ? "PUT" : "POST";
      const body = JSON.stringify({
        route_number: routeNumber.trim(),
        route_name: routeName.trim(),
        route_type: routeType,
        origin_stop_id: originStopId,
        destination_stop_id: destinationStopId,
        direction_group: directionGroup.trim() || null,
      });

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
    if (!confirm("Delete this route and all associated stops/schedules?")) return;

    try {
      const res = await fetch(`/api/admin/routes/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setRoutes((prev) => prev.filter((r) => r.id !== id));
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
          <h2 className="font-bold text-gray-900">{editing ? "Edit Route" : "Add New Route"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Number *</label>
              <input type="text" value={routeNumber} onChange={(e) => setRouteNumber(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Name *</label>
              <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Route Type *</label>
              <select value={routeType} onChange={(e) => setRouteType(e.target.value as "local" | "intercity")} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="local">Local</option>
                <option value="intercity">Intercity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction Group</label>
              <input type="text" value={directionGroup} onChange={(e) => setDirectionGroup(e.target.value)} placeholder="e.g. route-5a" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <p className="text-xs text-gray-400 mt-1">Same value for both directions of a service</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin Stop *</label>
              <select value={originStopId} onChange={(e) => setOriginStopId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select origin stop...</option>
                {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Stop *</label>
              <select value={destinationStopId} onChange={(e) => setDestinationStopId(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Select destination stop...</option>
                {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {!showAdd && !editing && (
        <button onClick={startAdd} className="self-start flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Route
        </button>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Route #</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Origin</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Direction Group</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {routes.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No routes yet.</td></tr>
            ) : routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{route.route_number}</td>
                <td className="px-4 py-3 text-gray-700">{route.route_name}</td>
                <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${route.route_type === "intercity" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{route.route_type}</span></td>
                <td className="px-4 py-3 text-gray-600">{route.origin?.name || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{route.destination?.name || "—"}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{route.direction_group || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => startEdit(route)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(route.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
