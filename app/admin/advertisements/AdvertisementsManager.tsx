"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus, ExternalLink } from "lucide-react";

interface Advertisement {
  id: string;
  business_name: string;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface AdvertisementsManagerProps {
  ads: Advertisement[];
}

export function AdvertisementsManager({ ads: initial }: AdvertisementsManagerProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ads, setAds] = useState<Advertisement[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function resetForm() {
    setBusinessName("");
    setLinkUrl("");
    setImageUrl("");
    setSelectedFile(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return null;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Upload failed"); return null; }
      return data.url as string;
    } catch {
      setError("Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!businessName.trim()) {
      setError("Business name is required");
      return;
    }

    let finalImageUrl = imageUrl;

    if (selectedFile) {
      const url = await handleUpload(selectedFile);
      if (!url) return;
      finalImageUrl = url;
    }

    if (!finalImageUrl) {
      setError("Please select an image");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/advertisements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName.trim(),
          image_url: finalImageUrl,
          link_url: linkUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); setSaving(false); return; }

      setAds((prev) => [...prev, data]);
      resetForm();
      setShowForm(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(item: Advertisement) {
    setError("");
    try {
      const res = await fetch(`/api/admin/advertisements/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setAds((prev) => prev.map((a) => a.id === item.id ? { ...a, is_active: !a.is_active } : a));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  async function handleUpdateOrder(item: Advertisement, order: number) {
    setError("");
    try {
      const res = await fetch(`/api/admin/advertisements/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_order: order }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed"); return; }
      setAds((prev) => prev.map((a) => a.id === item.id ? { ...a, display_order: order } : a));
      router.refresh();
    } catch {
      setError("Network error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this advertisement permanently?")) return;
    try {
      const res = await fetch(`/api/admin/advertisements/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
      setAds((prev) => prev.filter((a) => a.id !== id));
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
          <Plus className="w-4 h-4" /> Add Advertisement
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-gray-900">New Advertisement</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="e.g. Sri Ram Stores" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
              <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https:// or tel:..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image *</label>
            <div className="flex items-center gap-4">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              {uploading && <span className="text-sm text-gray-400">Uploading...</span>}
            </div>
            {selectedFile && (
              <p className="text-xs text-gray-400 mt-1">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving || uploading} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {uploading ? "Uploading..." : saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-center">Order</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ads.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No advertisements yet.</td></tr>
            ) : ads.map((ad) => (
              <tr key={ad.id} className={`hover:bg-gray-50 ${!ad.is_active ? "opacity-50" : ""}`}>
                <td className="px-4 py-3">
                  <img src={ad.image_url} alt={ad.business_name} className="w-16 h-12 object-cover rounded-lg border border-gray-200" />
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{ad.business_name}</td>
                <td className="px-4 py-3">
                  {ad.link_url ? (
                    <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> Link
                    </a>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(ad)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${ad.is_active ? "bg-primary" : "bg-gray-300"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${ad.is_active ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    value={ad.display_order}
                    onChange={(e) => handleUpdateOrder(ad, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(ad.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
