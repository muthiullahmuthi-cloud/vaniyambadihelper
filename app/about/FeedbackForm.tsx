"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "wrong_schedule", label: "Wrong Schedule" },
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "other", label: "Other" },
];

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("wrong_schedule");
  const [contactInfo, setContactInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!message.trim()) {
      setError("Please enter a message");
      setSaving(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from("feedback").insert({
        message: message.trim(),
        category,
        contact_info: contactInfo.trim() || null,
      });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
        <h3 className="font-bold text-gray-900 text-lg">Thank you!</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Your feedback has been submitted. I&rsquo;ll review it and follow up if needed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
          placeholder="Tell me what&rsquo;s wrong or what could be better..."
        />
      </div>

      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
          Contact info <span className="text-gray-400 font-normal">(optional — email, phone, etc.)</span>
        </label>
        <input
          id="contact"
          type="text"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="How should I reach you if I need more details?"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="self-start px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {saving ? "Sending..." : "Send Feedback"}
      </button>
    </form>
  );
}
