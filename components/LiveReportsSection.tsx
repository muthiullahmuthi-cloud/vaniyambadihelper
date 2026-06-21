"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RouteDetailExpanded } from "@/components/RouteDetailExpanded";
import { Clock, MapPin, Bus, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveReportItem {
  id: string;
  created_at: string;
  routes: { id: string; route_name: string };
  stops: { name: string };
}

interface LiveReportsSectionProps {
  reports: LiveReportItem[];
}

export function LiveReportsSection({ reports }: LiveReportsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (reports.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Bus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-semibold">No live reports right now</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-[250px]">
            Be the first to report a bus and help other commuters in Vaniyambadi!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reports.map((report) => {
        const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });
        const isExpanded = expandedId === report.id;

        return (
          <div key={report.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setExpandedId(isExpanded ? null : report.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setExpandedId(isExpanded ? null : report.id);
                }
              }}
              className="cursor-pointer"
            >
              <Card className={`overflow-hidden transition-colors hover:border-accent/50 ${isExpanded ? "border-accent/50 shadow-md rounded-b-none" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="live" className="text-[10px] uppercase px-2">Live</Badge>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">
                      {report.routes.route_name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-accent shrink-0" />
                      <span className="truncate">
                        Seen at <span className="font-semibold text-gray-900">{report.stops.name}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div
              className="overflow-hidden transition-[max-height] duration-200 ease-in-out"
              style={{ maxHeight: isExpanded ? "10000px" : "0" }}
            >
              {isExpanded && (
                <div className="border border-t-0 border-accent/50 rounded-b-xl bg-white p-5 shadow-md">
                  <RouteDetailExpanded routeId={report.routes.id} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
