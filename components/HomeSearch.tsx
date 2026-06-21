"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Search, MapPin, Bus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StopAutocomplete } from "@/components/StopAutocomplete";

export function HomeSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"place" | "route">("place");
  
  // State for place search
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  
  // State for route search
  const [routeNumber, setRouteNumber] = React.useState("");

  const handlePlaceSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from && !to) return;
    const params = new URLSearchParams(window.location.search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.delete("route");
    router.replace(`/?${params.toString()}`);
  };

  const handleRouteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeNumber) return;
    const params = new URLSearchParams(window.location.search);
    params.set("route", routeNumber);
    params.delete("from");
    params.delete("to");
    router.replace(`/?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto -mt-6 sm:-mt-10 relative z-10">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("place")}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              activeTab === "place"
                ? "bg-primary text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            Search by Place
          </button>
          <button
            onClick={() => setActiveTab("route")}
            className={cn(
              "flex-1 py-3 px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              activeTab === "route"
                ? "bg-primary text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            Search by Route
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6">
          {activeTab === "place" ? (
            <form onSubmit={handlePlaceSearch} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row relative">
                <div className="flex-1">
                  <StopAutocomplete
                    placeholder="From (e.g. Bus Stand)"
                    icon={<MapPin className="h-5 w-5 text-gray-400" />}
                    value={from}
                    onValueChange={(val) => setFrom(val)}
                  />
                </div>
                <div className="hidden sm:flex items-center justify-center text-gray-400">
                  →
                </div>
                <div className="flex-1">
                  <StopAutocomplete
                    placeholder="To (e.g. Ambur)"
                    icon={<MapPin className="h-5 w-5 text-gray-400" />}
                    value={to}
                    onValueChange={(val) => setTo(val)}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full py-6 text-base shadow-md">
                <Search className="mr-2 h-5 w-5" />
                Find Buses
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRouteSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Bus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Route number (e.g. 12A)"
                  value={routeNumber}
                  onChange={(e) => setRouteNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
              <Button type="submit" className="sm:w-32 py-6 text-base shadow-md">
                <Search className="mr-2 h-5 w-5 sm:hidden" />
                Search
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


