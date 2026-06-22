import { supabase } from "@/lib/supabase";
import { formatIST } from "@/lib/timeUtils";
import { Badge } from "@/components/ui/Badge";
import { Zap, Droplets, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface PowerWaterUpdate {
  id: string;
  type: "power_cut" | "water_supply";
  area: string;
  description: string;
  status: "active" | "resolved";
  starts_at: string;
  ends_at: string | null;
}

export default async function UpdatesPage() {
  const { data: updates } = await supabase
    .from("power_water_updates")
    .select("*")
    .eq("status", "active")
    .order("starts_at", { ascending: false });

  const activeUpdates = (updates as PowerWaterUpdate[]) || [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900">Power & Water Updates</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scheduled and ongoing utility updates in Vaniyambadi.
        </p>
      </div>

      {activeUpdates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-gray-500 font-medium">No active power or water issues reported right now</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeUpdates.map((update) => {
            const isPowerCut = update.type === "power_cut";
            const Icon = isPowerCut ? Zap : Droplets;

            return (
              <div
                key={update.id}
                className={`rounded-xl border-2 p-4 shadow-sm ${
                  isPowerCut
                    ? "border-amber-200 bg-amber-50/50"
                    : "border-blue-200 bg-blue-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isPowerCut ? "bg-amber-100" : "bg-blue-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isPowerCut ? "text-amber-600" : "text-primary"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-bold text-gray-900">
                        {isPowerCut ? "Power Cut" : "Water Supply"}
                      </h2>
                      <Badge
                        variant={isPowerCut ? "live" : "default"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {isPowerCut ? "Live" : "Active"}
                      </Badge>
                    </div>

                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      {update.area}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {update.description}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      <span className="font-medium">Started:</span>{" "}
                      {formatIST(new Date(update.starts_at), "d MMM, h:mm a")}
                      {update.ends_at ? (
                        <>
                          {" "}— <span className="font-medium">Until:</span>{" "}
                          {formatIST(new Date(update.ends_at), "d MMM, h:mm a")}
                        </>
                      ) : (
                        <span className="font-medium text-amber-600"> — Ongoing</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
