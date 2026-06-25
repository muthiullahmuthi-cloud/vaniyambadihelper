"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { Zap, Droplets, Hammer, Snowflake, Car, ShoppingCart, Pill, Wrench, BookOpen, Phone, ThumbsUp, ThumbsDown } from "lucide-react";
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

interface Listing {
  id: string;
  name: string;
  category: string;
  phone: string;
  area: string;
  photo_url: string | null;
  is_shop: boolean;
  status: string;
  created_at: string;
}

function formatTelLink(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `tel:+91${cleaned}`;
  }
  return `tel:${cleaned}`;
}

export default function DirectoryPage() {
  const [listings, setListings] = React.useState<Listing[]>([]);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [feedbackListingId, setFeedbackListingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchListings() {
      const { data } = await supabase
        .from("directory_listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setListings(data as Listing[]);
      setLoading(false);
    }
    fetchListings();
  }, []);

  const filtered = activeCategory
    ? listings.filter((l) => l.category === activeCategory)
    : listings;

  async function submitFeedback(listingId: string, wasHelpful: boolean) {
    await supabase.from("listing_feedback").insert({
      listing_id: listingId,
      was_helpful: wasHelpful,
    });
    setFeedbackListingId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">Directory</h1>
        <span className="text-sm text-gray-400">
          {listings.length} listing{listings.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const selected = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(selected ? null : cat.value)}
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

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm">
            {activeCategory
              ? "No listings in this category yet."
              : "No listings yet. Be the first to register!"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((listing) => (
            <div
              key={listing.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm"
            >
              {/* Photo / placeholder */}
              <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {listing.photo_url ? (
                  <img
                    src={listing.photo_url}
                    alt={listing.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (() => {
                    const cat = CATEGORIES.find((c) => c.value === listing.category);
                    const Icon = cat?.icon || Zap;
                    return <Icon className="w-6 h-6 text-gray-400" />;
                  })()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 truncate">{listing.name}</h3>
                  {listing.status === "new" && (
                    <Badge variant="secondary" className="flex-shrink-0 text-[10px] px-1.5 py-0">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{listing.area}</p>
              </div>

              {/* Call button */}
              <div className="flex-shrink-0 relative">
                <a
                  href={formatTelLink(listing.phone)}
                  onClick={() => {
                    setTimeout(() => setFeedbackListingId(listing.id), 2000);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors min-h-[48px] shadow-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>

                {/* Feedback prompt */}
                {feedbackListingId === listing.id && (
                  <div className="absolute top-0 right-0 translate-y-[-110%] bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 z-10 min-w-[180px]">
                    <span className="text-xs text-gray-600 font-medium whitespace-nowrap">Did they help you?</span>
                    <button
                      onClick={() => submitFeedback(listing.id, true)}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                      aria-label="Yes, helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => submitFeedback(listing.id, false)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      aria-label="No, not helpful"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
