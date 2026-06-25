"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

const PRAYER_FIELDS = [
  { key: "fajr", label: "Fajr (Morning)" },
  { key: "dhuhr", label: "Dhuhr (Noon)" },
  { key: "asr", label: "Asr (Afternoon)" },
  { key: "maghrib", label: "Maghrib (Evening)" },
  { key: "isha", label: "Isha (Night)" },
] as const;

export function MosqueRegisterForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [area, setArea] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [times, setTimes] = React.useState<Record<string, string>>({
    fajr: "", dhuhr: "", asr: "", maghrib: "", isha: "",
  });
  const [jumma, setJumma] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function updateTime(key: string, value: string) {
    setTimes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Mosque name is required"); return; }
    if (!area.trim()) { setError("Area is required"); return; }

    const requiredFields = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
    for (const key of requiredFields) {
      if (!times[key].trim()) {
        const label = PRAYER_FIELDS.find((f) => f.key === key)?.label || key;
        setError(`${label} time is required`);
        return;
      }
    }

    setSubmitting(true);

    const { error: insertError } = await supabase.from("mosques").insert({
      name: name.trim(),
      area: area.trim(),
      contact_phone: contactPhone.trim() || null,
      fajr: times.fajr.trim(),
      dhuhr: times.dhuhr.trim(),
      asr: times.asr.trim(),
      maghrib: times.maghrib.trim(),
      isha: times.isha.trim(),
      jumma: jumma.trim() || null,
      last_updated_by_mosque: new Date().toISOString(),
    });

    if (insertError) {
      setError("Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSuccess(true);
  }

  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push("/namaz"), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Thank you!</h1>
        <p className="text-gray-500 max-w-sm">
          Your mosque is now listed! People can see your timings.
        </p>
        <p className="text-xs text-gray-400">
          Redirecting to namaz timings...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-extrabold text-gray-900">Register Your Mosque</h1>
      <p className="text-sm text-gray-500 -mt-4">
        Enter the actual Azan times as announced by your mosque. Your listing will
        appear immediately on the namaz timings page.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Mosque Name *</label>
        <input
          type="text"
          placeholder="e.g. Vaniyambadi Jama Masjid"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[56px]"
          autoFocus
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
        <label className="text-sm font-medium text-gray-700">
          Contact Phone <span className="text-gray-400">(optional — for corrections)</span>
        </label>
        <input
          type="tel"
          placeholder="10-digit mobile number"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[56px]"
        />
      </div>

      <div className="flex flex-col gap-4">
        <label className="text-sm font-medium text-gray-700 block">
          Prayer Times *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PRAYER_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{field.label}</label>
              <input
                type="text"
                placeholder='e.g. 5:15 AM'
                value={times[field.key]}
                onChange={(e) => updateTime(field.key, e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[48px]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Jumma (Friday) <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. 1:15 PM"
          value={jumma}
          onChange={(e) => setJumma(e.target.value)}
          className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-h-[56px]"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full py-6 text-base shadow-md"
      >
        {submitting ? "Submitting..." : "Register Mosque"}
      </Button>
    </form>
  );
}
