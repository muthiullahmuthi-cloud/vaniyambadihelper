import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "live"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200/80": variant === "secondary",
          "text-gray-950": variant === "outline",
          "border-transparent bg-accent text-accent-foreground animate-pulse-glow": variant === "live",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
