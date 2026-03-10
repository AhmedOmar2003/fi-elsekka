import * as React from "react"
import { cn } from "./button"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-surface-hover", className)}
      {...props}
    />
  )
}
