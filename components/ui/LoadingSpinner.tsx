import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number
}

function LoadingSpinner({ className, size = 24, ...props }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <Loader2 size={size} className="animate-spin text-gray-400" />
    </div>
  )
}

export { LoadingSpinner }
