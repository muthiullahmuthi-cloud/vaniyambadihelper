"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Zap, Droplets, Hammer, Snowflake, Car, ShoppingCart, Pill, Wrench, BookOpen, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "electrician", label: "Electrician", icon: Zap },
  { value: "plumber", label: "Plumber", icon: Droplets },
  { value: "carpenter", label: "Carpenter", icon: Hammer },
  { value: "ac_repair", label: "AC Repair", icon: Snowflake },
  { value: "auto_taxi_driver", label: "Auto / Taxi", icon: Car },
  { value: "grocery", label: "Grocery", icon: ShoppingCart },
  { value: "medical", label: "Medical", icon: Pill },
  { value: "hardware", label: "Hardware", icon: Wrench },
  { value: "tutor", label: "Tutor", icon: BookOpen },
] as const;

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState("");
  const [area, setArea] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function validatePhone(value: string): boolean {
    return /^[6-9]\d{9}$/.test(value.replace(/[\s-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedPhone = phone.replace(/[\s-]/g, "");

    if (!name.trim()) { setError("Name is required"); return; }
    if (!category) { setError("Please select a category"); return; }
    if (!validatePhone(cleanedPhone)) { setError("Enter a valid 10-digit Indian mobile number"); return; }
    if (!area.trim()) { setError("Area is required"); return; }

    let photoUrl: string | null = null;

    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("Photo must be under 5MB");
        return;
      }
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const res = await fetch("/api/directory/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Upload failed"); setUploading(false); return; }
        photoUrl = data.url;
      } catch {
        setError("Upload failed. Please try again.");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setSubmitting(true);

    const isShop = category === "grocery" || category === "medical" || category === "hardware";

    const { error: insertError } = await supabase.from("directory_listings").insert({
      name: name.trim(),
      category,
      phone: cleanedPhone,
      area: area.trim(),
      photo_url: photoUrl,
      is_shop: isShop,
    });

    if (insertError) {
      setError("Failed to save. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);

    setTimeout(() => {
      router.push("/directory");
    }, 2000);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">You&apos;re listed!</h1>
        <p className="text-gray-500 max-w-xs">
          People can now find and call you.
        </p>
        <p className="text-xs text-gray-400">
          Redirecting to directory...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-extrabold text-gray-900">Register Your Business</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Name *</label>
        <input
          type="text"
          placeholder="Your name or business name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[56px]"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Category *</label>
        <div className="grid grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const selected = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-2 py-4 rounded-xl border-2 text-sm font-medium transition-all min-h-[72px]",
                  selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs leading-tight text-center">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Phone *</label>
        <input
          type="tel"
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[56px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Area *</label>
        <input
          type="text"
          placeholder="e.g. Bazaar Street, Officer's Line"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[56px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Photo (optional)</label>
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:min-h-[44px]"
          />
          {uploading && <Upload className="w-5 h-5 text-gray-400 animate-pulse" />}
        </div>
        {selectedFile && (
          <p className="text-xs text-gray-400 mt-1">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting || uploading}
        className="w-full py-6 text-base shadow-md"
      >
        {submitting ? "Submitting..." : uploading ? "Uploading..." : "Register Now"}
      </Button>
    </form>
  );
}
