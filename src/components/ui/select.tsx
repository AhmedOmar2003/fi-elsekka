import * as React from "react"
import { cn } from "./button"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-12 w-full appearance-none rounded-xl border border-surface-hover bg-surface px-4 py-2 pr-10 text-sm text-foreground transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-secondary focus-visible:ring-secondary",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {/* Custom chevron icon for RTL/LTR */}
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-4 text-gray-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
