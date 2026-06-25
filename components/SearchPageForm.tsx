"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Search, MapPin } from "lucide-react";
import { StopAutocomplete } from "@/components/StopAutocomplete";

export function SearchPageForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [from, setFrom] = React.useState(searchParams.get("from") || "");
  const [to, setTo] = React.useState(searchParams.get("to") || "");
  const fromRef = React.useRef(from);
  const toRef = React.useRef(to);

  React.useEffect(() => {
    fromRef.current = from;
  }, [from]);

  React.useEffect(() => {
    toRef.current = to;
  }, [to]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const f = fromRef.current;
    const t = toRef.current;
    if (!f && !t) return;
    const params = new URLSearchParams();
    if (f) params.set("from", f);
    if (t) params.set("to", t);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <StopAutocomplete
          placeholder="From (e.g. Bus Stand)"
          icon={<MapPin className="h-5 w-5 text-gray-400" />}
          value={from}
          onValueChange={(val) => {
            fromRef.current = val;
            setFrom(val);
          }}
        />
      </div>
      <div className="flex items-center justify-center text-gray-400 hidden sm:flex">
        →
      </div>
      <div className="flex-1">
        <StopAutocomplete
          placeholder="To (e.g. Ambur)"
          icon={<MapPin className="h-5 w-5 text-gray-400" />}
          value={to}
          onValueChange={(val) => {
            toRef.current = val;
            setTo(val);
          }}
        />
      </div>
      <Button type="submit" className="sm:w-auto py-3 px-6 text-base shadow-md shrink-0">
        <Search className="mr-2 h-5 w-5" />
        Find Buses
      </Button>
    </form>
  );
}
