"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, Upload } from "lucide-react";

interface Route {
  id: string;
  route_number: string;
  route_name: string;
}

interface Schedule {
  id: string;
  route_id: string;
  departure_time: string;
  days_of_week: string[];
  operator_name: string | null;
  bus_category: string | null;
}

interface SchedulesManagerProps {
  routes: Route[];
}

const DAY_OPTIONS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export function SchedulesManager({ routes }: SchedulesManagerProps) {
  const router = useRouter();
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [departureTime, setDepartureTime] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [operatorName, setOperatorName] = useState("");
  const [busCategory, setBusCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // CSV import state
  const [showCsv, setShowCsv] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState<{ inserted: number; errors: { row: number; error: string }[] } | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const fetchSchedules = useCallback(async (routeId: string) => {
    if (!routeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/schedules?route_id=${routeId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to fetch"); setSchedules([]); return; }
      setSchedules(data);
    } catch {
      setError("Network error");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRouteId) { fetchSchedules(selectedRouteId); setShowAdd(false); setEditing(null); setShowCsv(false); }
    else setSchedules([]);
  }, [selectedRouteId, fetchSchedules]);

  function toggleDay(day: string) {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  }

  function resetForm() {
    setDepartureTime("");
    setSelectedDays([]);
    setOperatorName("");
    setBusCategory("");
    setError("");
  }

  function startAdd() {
    setEditing(null);
    resetForm();
    setShowAdd(true);
  }

  function startEdit(schedule: Schedule) {
    setEditing(schedule);
    setDepartureTime(schedule.departure_time.substring(0, 5));
    setSelectedDays([...schedule.days_of_week]);
    setOperatorName(schedule.operator_name || "");
    setBusCategory(schedule.bus_category || "");
    setShowAdd(false);
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

    if (!departureTime) { setError("Departure time is required"); setSaving(false); return; }
    if (selectedDays.length === 0) { setError("Select at least one day"); setSaving(false); return; }

    try {
      const url = editing ? `/api/admin/schedules/${editing.id}` : "/api/admin/schedules";
      const method = editing ? "PUT" : "POST";
      const body = JSON.stringify({
        route_id: selectedRouteId,
        departure_time: departureTime,
        days_of_week: selectedDays,
        operator_name: operatorName.trim() || null,
        bus_category: busCategory.trim() || null,
      });

      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }

      cancelForm();
      fetchSchedules(selectedRouteId);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this schedule entry?")) return;
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      fetchSchedules(selectedRouteId);
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    setCsvImporting(true);
    setCsvResult(null);
    setError("");

    try {
      const lines = csvText.trim().split("\n");
      if (lines.length < 2) { setError("CSV must have a header row and at least one data row"); setCsvImporting(false); return; }

      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const routeNumberIdx = header.indexOf("route_number");
      const departureTimeIdx = header.indexOf("departure_time");
      const daysOfWeekIdx = header.indexOf("days_of_week");
      const busCategoryIdx = header.indexOf("bus_category");

      if (routeNumberIdx === -1 || departureTimeIdx === -1 || daysOfWeekIdx === -1) {
        setError("CSV must have columns: route_number, departure_time, days_of_week");
        setCsvImporting(false);
        return;
      }

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        if (cols.every((c) => !c)) continue;
        rows.push({
          route_number: cols[routeNumberIdx] || "",
          departure_time: cols[departureTimeIdx] || "",
          days_of_week: cols[daysOfWeekIdx] || "",
          bus_category: busCategoryIdx !== -1 ? (cols[busCategoryIdx] || "") : "",
        });
      }

      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulk: true, rows }),
      });

      const data = await res.json();
      setCsvResult(data);
      if (data.inserted > 0) {
        fetchSchedules(selectedRouteId);
        router.refresh();
      }
    } catch {
      setError("Failed to parse CSV");
    } finally {
      setCsvImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Route</label>
        <select
          value={selectedRouteId}
          onChange={(e) => setSelectedRouteId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a route...</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.route_number} — {r.route_name}</option>)}
        </select>
      </div>

      {selectedRouteId && (
        <>
          {loading ? (
            <p className="text-sm text-gray-400">Loading schedules...</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Departure</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No schedules for this route.</td></tr>
                  ) : schedules.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 font-mono">{s.departure_time.substring(0, 5)}</td>
                      <td className="px-4 py-3 text-gray-600">{s.days_of_week.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ")}</td>
                      <td className="px-4 py-3 text-gray-600">{s.operator_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{s.bus_category || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => startEdit(s)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={startAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" /> Add Schedule
            </button>
            <button onClick={() => { setShowCsv(!showCsv); setShowAdd(false); setEditing(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showCsv ? "bg-gray-100 border-gray-300" : "border-gray-300 hover:bg-gray-50"}`}>
              <Upload className="w-4 h-4" /> Bulk CSV Import
            </button>
          </div>

          {(showAdd || editing) && (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-gray-900">{editing ? "Edit Schedule" : "Add Schedule Entry"}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time *</label>
                  <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <input type="text" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bus Category</label>
                  <input type="text" value={busCategory} onChange={(e) => setBusCategory(e.target.value)} placeholder="e.g. Express, Ordinary" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week *</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedDays.includes(day)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary/50"
                      }`}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                <button type="button" onClick={cancelForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          )}

          {showCsv && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-gray-900">Bulk CSV Import</h3>
              <p className="text-sm text-gray-500">Paste CSV data with columns: <code className="bg-gray-100 px-1 rounded">route_number, departure_time, days_of_week, bus_category</code></p>
              <p className="text-xs text-gray-400">days_of_week format: comma-separated 3-letter codes like <code className="bg-gray-100 px-1 rounded">mon,tue,wed,thu,fri</code></p>

              <form onSubmit={handleCsvImport} className="space-y-4">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={`route_number,departure_time,days_of_week,bus_category
1A,06:00,mon,tue,wed,thu,fri,Express
1A,07:30,mon,tue,wed,thu,fri,sat,sun,Ordinary`}
                  required
                />
                <div className="flex gap-3">
                  <button type="submit" disabled={csvImporting} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                    <Upload className="w-4 h-4" /> {csvImporting ? "Importing..." : "Import"}
                  </button>
                </div>
              </form>

              {csvResult && (
                <div className="space-y-2">
                  <p className={`text-sm font-medium ${csvResult.inserted > 0 ? "text-green-700" : "text-red-700"}`}>
                    {csvResult.inserted > 0 ? `✓ ${csvResult.inserted} schedule(s) imported` : "No schedules imported"}
                  </p>
                  {csvResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                      <p className="font-medium text-red-700 mb-1">{csvResult.errors.length} error(s):</p>
                      <ul className="list-disc pl-4 text-red-600 space-y-0.5">
                        {csvResult.errors.map((e, i) => <li key={i}>Row {e.row}: {e.error}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
