"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function TypeToggle() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "local";

  return (
    <div className="flex justify-center my-8">
      <div className="inline-flex bg-gray-100 p-1 rounded-full shadow-sm">
        <Link
          href="/?type=local"
          className={cn(
            "px-6 py-2 rounded-full text-sm font-semibold transition-all",
            type === "local" || type === ""
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Town Buses
        </Link>
        <Link
          href="/?type=intercity"
          className={cn(
            "px-6 py-2 rounded-full text-sm font-semibold transition-all",
            type === "intercity"
              ? "bg-white text-primary shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          Intercity Buses
        </Link>
      </div>
    </div>
  );
}
