"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, RotateCcw, MessageSquare } from "lucide-react";

interface Feedback {
  id: string;
  message: string;
  contact_info: string | null;
  category: string;
  created_at: string;
  resolved: boolean;
}

interface FeedbackManagerProps {
  feedback: Feedback[];
}

const CATEGORY_LABELS: Record<string, string> = {
  wrong_schedule: "Wrong Schedule",
  bug: "Bug",
  suggestion: "Suggestion",
  other: "Other",
};

const CATEGORY_COLORS: Record<string, string> = {
  wrong_schedule: "bg-orange-100 text-orange-700",
  bug: "bg-red-100 text-red-700",
  suggestion: "bg-blue-100 text-blue-700",
  other: "bg-gray-100 text-gray-700",
};

export function FeedbackManager({ feedback: initial }: FeedbackManagerProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<Feedback[]>(initial);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Feedback | null>(null);

  async function toggleResolved(item: Feedback) {
    setError("");
    try {
      const res = await fetch(`/api/admin/feedback/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: !item.resolved }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setFeedback((prev) => prev.map((f) => f.id === item.id ? { ...f, resolved: !f.resolved } : f));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Unresolved: {feedback.filter((f) => !f.resolved).length}</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-600" /> Resolved: {feedback.filter((f) => f.resolved).length}</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> Total: {feedback.length}</span>
      </div>

      {selected && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[selected.category] || CATEGORY_COLORS.other}`}>{CATEGORY_LABELS[selected.category] || selected.category}</span>
              {selected.resolved ? <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Resolved</span> : <span className="text-xs text-gray-400">Unresolved</span>}
            </div>
            <button onClick={() => setSelected(null)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{selected.message}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{selected.contact_info ? `Contact: ${selected.contact_info}` : "No contact info"}</span>
            <span>{new Date(selected.created_at).toLocaleString("en-IN")}</span>
          </div>
          <button onClick={() => toggleResolved(selected)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selected.resolved ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
            {selected.resolved ? <><RotateCcw className="w-3 h-3" /> Mark unresolved</> : <><CheckCircle className="w-3 h-3" /> Mark resolved</>}
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Message</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {feedback.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No feedback yet.</td></tr>
            ) : feedback.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-50 cursor-pointer ${item.resolved ? "opacity-60" : ""}`} onClick={() => setSelected(item)}>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{new Date(item.created_at).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other}`}>{CATEGORY_LABELS[item.category] || item.category}</span></td>
                <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{item.message}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{item.contact_info || "—"}</td>
                <td className="px-4 py-3 text-center">{item.resolved ? <CheckCircle className="w-4 h-4 text-green-600 mx-auto" /> : <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={(e) => { e.stopPropagation(); toggleResolved(item); }} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${item.resolved ? "text-gray-500 hover:bg-gray-100" : "text-green-600 hover:bg-green-50"}`}>
                    {item.resolved ? "Reopen" : "Resolve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
