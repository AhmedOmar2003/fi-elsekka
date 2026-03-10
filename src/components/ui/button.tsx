import * as React from "react"

// A simple utility to merge tailwind classes, using a basic custom wrapper
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, asChild, children, ...props }, ref) => {
    
    // Base classes ensure proper tap targets and accessible states
    const baseClasses = "inline-flex items-center justify-center rounded-xl font-heading font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary-hover shadow-sm",
      secondary: "bg-surface-hover text-foreground hover:bg-surface",
      outline: "border-2 border-surface-hover bg-transparent hover:bg-surface-hover text-foreground",
      ghost: "hover:bg-surface-hover text-foreground",
      danger: "bg-secondary text-white hover:bg-rose-600 shadow-sm",
    }

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-11 w-11",
    }
    
    const finalClassName = cn(baseClasses, variants[variant], sizes[size], className);

    if (asChild && React.isValidElement(children)) {
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const child = children as React.ReactElement<any>;
       return React.cloneElement(child, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          className: cn(finalClassName, (child.props as any).className),
          ...props,
          // eslint-disable-next-line react-hooks/refs
          ref,
       });
    }

    return (
      <button
        ref={ref}
        className={finalClassName}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
