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
    
    const baseClasses = "relative inline-flex items-center justify-center gap-2 rounded-xl font-heading font-semibold tracking-wide transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]"
    
    const variants = {
      primary: "bg-primary text-white shadow-premium hover:bg-primary-hover hover:shadow-glow-primary border border-transparent hover:-translate-y-0.5",
      secondary: "bg-surface-container text-foreground border border-surface-border shadow-sm hover:bg-surface-container-high hover:border-surface-border/80 hover:-translate-y-0.5",
      outline: "border border-surface-border bg-transparent text-foreground hover:bg-surface-hover hover:border-primary/30",
      ghost: "bg-transparent text-foreground hover:bg-surface-container",
      danger: "bg-secondary text-white shadow-premium hover:bg-secondary-hover hover:-translate-y-0.5",
    }

    const sizes = {
      sm: "h-9 px-4 text-xs rounded-lg",
      md: "h-11 px-5 text-sm",
      lg: "h-13 px-8 text-base rounded-2xl",
      icon: "h-11 w-11 rounded-xl",
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
