"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Clock, MapPin, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getTwentyMinutesAgoIST } from "@/lib/timeUtils";
import { Badge } from "@/components/ui/Badge";

interface LiveReport {
  id: string;
  created_at: string;
  stop_name: string;
}

interface LiveActivityFeedProps {
  routeId: string;
  initialReports: LiveReport[];
}

export default function LiveActivityFeed({
  routeId,
  initialReports,
}: LiveActivityFeedProps) {
  const [reports, setReports] = useState<LiveReport[]>(initialReports);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchReports = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const twentyMinsAgo = getTwentyMinutesAgoIST();
      const { data } = await supabase
        .from("live_reports")
        .select(`
          id,
          created_at,
          stops:reported_stop_id(name)
        `)
        .eq("route_id", routeId)
        .gte("created_at", twentyMinsAgo)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        const mapped = (data as unknown as Array<{
          id: string;
          created_at: string;
          stops: { name: string };
        }>).map((r) => ({
          id: r.id,
          created_at: r.created_at,
          stop_name: r.stops?.name || "Unknown stop",
        }));
        setReports(mapped);
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error refreshing live reports:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [routeId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchReports, 30_000);
    return () => clearInterval(interval);
  }, [fetchReports]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
          </span>
          Recent Activity
        </h2>
        <button
          onClick={fetchReports}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {reports.length > 0 ? (
        <div className="space-y-3">
          {reports.map((report) => {
            const timeAgo = formatDistanceToNow(new Date(report.created_at), {
              addSuffix: true,
            });
            return (
              <div
                key={report.id}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="mt-0.5 shrink-0">
                  <MapPin className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Seen at <span className="font-bold">{report.stop_name}</span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {timeAgo}
                  </p>
                </div>
                <Badge variant="live" className="text-[9px] uppercase shrink-0">
                  Live
                </Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-sm text-gray-500">No recent sightings for this route.</p>
          <p className="text-xs text-gray-400 mt-1">
            Reports expire after 20 minutes.
          </p>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-right mt-2">
        Auto-refreshes every 30s · Last: {lastRefreshed.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
