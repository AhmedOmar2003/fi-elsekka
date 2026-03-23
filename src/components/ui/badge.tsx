import * as React from "react"
import { cn } from "./button"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" | "success";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary tracking-wide shadow-sm"
  
  const variants = {
    default: "border-primary/10 bg-surface-accent text-primary hover:bg-surface-accent-strong",
    secondary: "border-surface-border bg-surface-container text-foreground hover:bg-surface-container-high",
    destructive: "border-secondary/10 bg-secondary/10 text-secondary hover:bg-secondary/20",
    success: "border-emerald-500/10 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
    outline: "text-foreground border-surface-border bg-transparent",
  }

  return (
    <div className={cn(baseClasses, variants[variant], className)} {...props} />
  )
}

export { Badge }
