"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { getNextDepartures } from "@/lib/timeUtils";
import { RouteDetailExpanded } from "@/components/RouteDetailExpanded";

interface RouteResultCardRoute {
  id: string;
  route_number: string;
  route_name: string;
  origin?: { name: string };
  destination?: { name: string };
  schedules?: { departure_time: string; days_of_week: string[] }[];
}

interface RouteResultCardProps {
  route: RouteResultCardRoute;
  isLive: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function RouteResultCard({ route, isLive, isExpanded, onToggle }: RouteResultCardProps) {
  const nextDepartures = getNextDepartures(route.schedules || []);

  function cardContent(showChevron: boolean) {
    return (
      <Card className={`transition-all ${onToggle ? "hover:border-primary/50 hover:shadow-md cursor-pointer" : "hover:border-primary/50 hover:shadow-md"} ${isExpanded ? "border-primary/50 shadow-md rounded-b-none" : ""}`}>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-bold text-primary bg-primary/10 text-sm">
                {route.route_number}
              </Badge>
              {isLive && (
                <Badge variant="live" className="text-[10px] uppercase px-2 animate-pulse-glow">
                  Live
                </Badge>
              )}
            </div>
            {showChevron && (
              <div className="text-gray-400 shrink-0">
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">
            {route.route_name}
          </h2>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
              {route.origin?.name || "Unknown Origin"}
            </span>
            <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
              {route.destination?.name || "Unknown Dest"}
            </span>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Next Departures</p>
              {nextDepartures.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nextDepartures.map((time, idx) => (
                    <span key={idx} className="text-sm font-semibold text-primary bg-white border border-gray-200 px-2 py-1 rounded">
                      {time}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-600 italic">No schedule available</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expand mode (used on home page)
  if (onToggle) {
    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        >
          {cardContent(true)}
        </div>
        <div
          className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
          style={{ maxHeight: isExpanded ? "10000px" : "0" }}
        >
          {isExpanded && (
            <div className="border border-t-0 border-primary/50 rounded-b-xl bg-white p-5 shadow-md">
              <RouteDetailExpanded routeId={route.id} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Navigation mode (used on /search page fallback)
  return (
    <Link href={`/route/${route.id}`}>
      {cardContent(false)}
    </Link>
  );
}
