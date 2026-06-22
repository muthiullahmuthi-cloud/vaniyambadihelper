"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle, Pencil, XCircle } from "lucide-react";

interface Mosque {
  id: string;
  name: string;
  area: string;
  contact_phone: string | null;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jumma: string | null;
  status: "pending" | "verified";
  last_updated_by_mosque: string;
  created_at: string;
}

interface NamazManagerProps {
  mosques: Mosque[];
}

export function NamazManager({ mosques: initial }: NamazManagerProps) {
  const router = useRouter();
  const [mosques, setMosques] = useState<Mosque[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pending = mosques.filter((m) => m.status === "pending");
  const verified = mosques.filter((m) => m.status === "verified");

  async function handleVerify(id: string) {
    setError("");
    try {
      const res = await fetch(`/api/admin/namaz/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "verified" }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setMosques((prev) => prev.map((m) => m.id === id ? { ...m, status: "verified" } : m));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this mosque entry permanently?")) return;
    try {
      const res = await fetch(`/api/admin/namaz/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setMosques((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  function openEdit(mosque: Mosque) {
    setEditingId(mosque.id);
    setError("");
  }

  async function handleEditSave(id: string, formData: FormData) {
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {};
    for (const [key, value] of Array.from(formData.entries())) {
      if (key === "contact_phone" || key === "jumma") {
        body[key] = (value as string).trim() || null;
      } else {
        body[key] = (value as string).trim();
      }
    }

    try {
      const res = await fetch(`/api/admin/namaz/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); setSaving(false); return; }
      const updated = await res.json();
      setMosques((prev) => prev.map((m) => m.id === id ? { ...m, ...updated } : m));
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  return (
    <div className="flex flex-col gap-8">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Pending Section */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Pending Verification ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No pending mosque registrations.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((mosque) => (
              <div key={mosque.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{mosque.name}</h3>
                    <p className="text-sm text-gray-500">{mosque.area}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleVerify(mosque.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Verify"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(mosque.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Reject / Delete"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div><span className="text-gray-400">Fajr</span><p className="font-medium">{mosque.fajr}</p></div>
                  <div><span className="text-gray-400">Dhuhr</span><p className="font-medium">{mosque.dhuhr}</p></div>
                  <div><span className="text-gray-400">Asr</span><p className="font-medium">{mosque.asr}</p></div>
                  <div><span className="text-gray-400">Maghrib</span><p className="font-medium">{mosque.maghrib}</p></div>
                  <div><span className="text-gray-400">Isha</span><p className="font-medium">{mosque.isha}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Verified Section */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Verified ({verified.length})
        </h2>

        {verified.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No verified mosques yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {verified.map((mosque) => (
              <div key={mosque.id} className="bg-white border border-gray-200 rounded-xl p-4">
                {editingId === mosque.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleEditSave(mosque.id, new FormData(e.currentTarget)); }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Name</label>
                        <input name="name" defaultValue={mosque.name} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Area</label>
                        <input name="area" defaultValue={mosque.area} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Contact</label>
                        <input name="contact_phone" defaultValue={mosque.contact_phone || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Jumma</label>
                        <input name="jumma" defaultValue={mosque.jumma || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {["fajr", "dhuhr", "asr", "maghrib", "isha"].map((key) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-0.5 capitalize">{key}</label>
                          <input name={key} defaultValue={(mosque as unknown as Record<string, string>)[key]} required className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={saving} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                      <button type="button" onClick={cancelEdit} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{mosque.name}</h3>
                        <p className="text-sm text-gray-500">{mosque.area}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(mosque)}
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mosque.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div><span className="text-gray-400">Fajr</span><p className="font-medium">{mosque.fajr}</p></div>
                      <div><span className="text-gray-400">Dhuhr</span><p className="font-medium">{mosque.dhuhr}</p></div>
                      <div><span className="text-gray-400">Asr</span><p className="font-medium">{mosque.asr}</p></div>
                      <div><span className="text-gray-400">Maghrib</span><p className="font-medium">{mosque.maghrib}</p></div>
                      <div><span className="text-gray-400">Isha</span><p className="font-medium">{mosque.isha}</p></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
