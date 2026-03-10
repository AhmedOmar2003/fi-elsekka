import * as React from "react"
import { cn } from "./button"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
  
  const variants = {
    default: "border-transparent bg-primary text-white hover:bg-primary/80",
    secondary: "border-transparent bg-surface-hover text-foreground hover:bg-surface-hover/80",
    destructive: "border-transparent bg-secondary text-white hover:bg-secondary/80",
    success: "border-transparent bg-green-500 text-white hover:bg-green-600",
    outline: "text-foreground border-surface-hover",
  }

  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props} />
  )
}

export { Badge }
