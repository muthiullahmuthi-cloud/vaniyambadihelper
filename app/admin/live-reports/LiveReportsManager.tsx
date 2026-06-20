"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Bus, MapPin } from "lucide-react";

interface Report {
  id: string;
  route_id: string;
  reported_stop_id: string;
  note: string | null;
  reporter_session_id: string;
  created_at: string;
  routes: { route_number: string; route_name: string };
  stops: { name: string };
}

interface LiveReportsManagerProps {
  reports: Report[];
}

export function LiveReportsManager({ reports: initial }: LiveReportsManagerProps) {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>(initial);
  const [error, setError] = useState("");

  async function handleDelete(id: string) {
    if (!confirm("Delete this report?")) return;

    try {
      const res = await fetch(`/api/admin/live-reports/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setReports((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  async function handleDeleteAllFromSession(sessionId: string) {
    const count = reports.filter((r) => r.reporter_session_id === sessionId).length;
    if (!confirm(`Delete all ${count} report(s) from this session?`)) return;

    try {
      const ids = reports.filter((r) => r.reporter_session_id === sessionId).map((r) => r.id);
      await Promise.all(ids.map((id) => fetch(`/api/admin/live-reports/${id}`, { method: "DELETE" })));
      setReports((prev) => prev.filter((r) => r.reporter_session_id !== sessionId));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  const sessionCounts = new Map<string, number>();
  reports.forEach((r) => {
    sessionCounts.set(r.reporter_session_id, (sessionCounts.get(r.reporter_session_id) || 0) + 1);
  });

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="text-sm text-gray-500">
        Showing {reports.length} report(s). Reports older than 20 minutes are no longer displayed publicly.
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Stop</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No reports yet.</td></tr>
            ) : reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(report.created_at).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-gray-900">{report.routes.route_number}</span>
                    <span className="text-gray-400 text-xs">{report.routes.route_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-700">{report.stops.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{report.note || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-gray-400" title={report.reporter_session_id}>{report.reporter_session_id.substring(0, 8)}...</span>
                    {sessionCounts.get(report.reporter_session_id)! > 1 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">{sessionCounts.get(report.reporter_session_id)}×</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {sessionCounts.get(report.reporter_session_id)! > 1 && (
                      <button onClick={() => handleDeleteAllFromSession(report.reporter_session_id)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors text-xs" title="Delete all from this session">All</button>
                    )}
                    <button onClick={() => handleDelete(report.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
