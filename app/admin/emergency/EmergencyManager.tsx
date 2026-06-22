"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, Pencil } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  category: string;
  phone: string;
  address: string | null;
  is_24x7: boolean;
  display_order: number;
  created_at: string;
}

interface EmergencyManagerProps {
  contacts: EmergencyContact[];
}

const CATEGORIES = [
  { value: "national", label: "National" },
  { value: "hospital", label: "Hospital" },
  { value: "police", label: "Police" },
  { value: "fire", label: "Fire" },
  { value: "ambulance", label: "Ambulance" },
  { value: "electricity_board", label: "Electricity Board" },
  { value: "water_board", label: "Water Board" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM = {
  name: "",
  category: "hospital",
  phone: "",
  address: "",
  is_24x7: false,
  display_order: 0,
};

export function EmergencyManager({ contacts: initial }: EmergencyManagerProps) {
  const router = useRouter();
  const [contacts, setContacts] = useState<EmergencyContact[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("hospital");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [is24x7, setIs24x7] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);

  function resetForm() {
    setName("");
    setCategory("hospital");
    setPhone("");
    setAddress("");
    setIs24x7(false);
    setDisplayOrder(0);
    setError("");
    setEditingId(null);
  }

  function openEdit(item: EmergencyContact) {
    setName(item.name);
    setCategory(item.category);
    setPhone(item.phone);
    setAddress(item.address || "");
    setIs24x7(item.is_24x7);
    setDisplayOrder(item.display_order);
    setEditingId(item.id);
    setShowForm(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!name.trim()) { setError("Name is required"); setSaving(false); return; }
    if (!phone.trim()) { setError("Phone is required"); setSaving(false); return; }

    try {
      const url = editingId
        ? `/api/admin/emergency/${editingId}`
        : "/api/admin/emergency";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          phone: phone.trim(),
          address: address.trim() || null,
          is_24x7: is24x7,
          display_order: displayOrder,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }

      if (editingId) {
        setContacts((prev) => prev.map((c) => c.id === editingId ? { ...c, ...data } : c));
      } else {
        setContacts((prev) => [...prev, data]);
      }

      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contact permanently?")) return;
    try {
      const res = await fetch(`/api/admin/emergency/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setContacts((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  const CATEGORY_COLORS: Record<string, string> = {
    national: "bg-red-100 text-red-700",
    hospital: "bg-red-50 text-red-600",
    police: "bg-blue-100 text-blue-700",
    fire: "bg-orange-100 text-orange-700",
    ambulance: "bg-red-100 text-red-700",
    electricity_board: "bg-yellow-100 text-yellow-700",
    water_board: "bg-cyan-100 text-cyan-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="self-start flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Contact
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900">{editingId ? "Edit Contact" : "New Emergency Contact"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Vaniyambadi Government Hospital" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 112 or +919876543210" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Leave blank for national numbers" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={is24x7} onChange={(e) => setIs24x7(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
            Open 24x7
          </label>

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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3 text-center">24x7</th>
              <th className="px-4 py-3 text-center">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {contacts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No emergency contacts yet.</td></tr>
            ) : contacts.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[item.category] || "bg-gray-100 text-gray-700"}`}>{CATEGORIES.find(c => c.value === item.category)?.label || item.category}</span></td>
                <td className="px-4 py-3 text-gray-600">{item.phone}</td>
                <td className="px-4 py-3 text-center">{item.is_24x7 ? <span className="text-green-600 font-medium text-xs">Yes</span> : <span className="text-gray-400 text-xs">No</span>}</td>
                <td className="px-4 py-3 text-center text-gray-500">{item.display_order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
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
