"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ad {
  id: string;
  business_name: string;
  image_url: string;
  link_url: string | null;
}

function formatAdLink(linkUrl: string): string {
  const trimmed = linkUrl.trim();
  if (trimmed.startsWith("tel:")) return trimmed;
  if (/^[\d\+\-\s()]+$/.test(trimmed)) return `tel:${trimmed.replace(/[\s-]/g, "")}`;
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export function AdBoard() {
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    supabase
      .from("advertisements")
      .select("id, business_name, image_url, link_url")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) setAds(data as Ad[]);
      });
  }, []);

  React.useEffect(() => {
    if (ads.length < 2 || paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length, paused]);

  if (ads.length === 0) return null;

  const ad = ads[current];

  function goTo(index: number) {
    setCurrent(index);
  }

  function prev() {
    setCurrent((prev) => (prev - 1 + ads.length) % ads.length);
  }

  function next() {
    setCurrent((prev) => (prev + 1) % ads.length);
  }

  const inner = (
    <div
      className="relative overflow-hidden rounded-xl bg-gray-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <img
        src={ad.image_url}
        alt={ad.business_name}
        className="w-full aspect-video object-contain bg-white"
      />
      <div className="px-3 py-2 text-center">
        <p className="text-xs font-medium text-gray-500 truncate">
          {ad.business_name}
        </p>
      </div>

      {ads.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
            aria-label="Previous ad"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center text-gray-600 hover:bg-white transition-colors"
            aria-label="Next ad"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === current
                    ? "bg-primary w-3"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to ad ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (ad.link_url) {
    const href = formatAdLink(ad.link_url);
    return (
      <a
        href={href}
        target={href.startsWith("tel:") ? undefined : "_blank"}
        rel={href.startsWith("tel:") ? undefined : "noopener noreferrer"}
        className="block"
      >
        {inner}
      </a>
    );
  }

  return inner;
}
