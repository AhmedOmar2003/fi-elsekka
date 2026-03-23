import * as React from "react"
import Link from "next/link"
import { cn } from "./button"

export interface CategoryCardProps {
  slug: string;
  name: string;
  icon?: React.ReactNode;
  imageUrl?: string;
  className?: string;
}

export function CategoryCard({ slug, name, icon, imageUrl, className }: CategoryCardProps) {
  return (
    <Link 
      href={`/category/${slug}`}
      className={cn(
        "group flex flex-col items-center gap-3 rounded-[28px] border border-surface-border/70 bg-surface-container-low px-3 py-4 shadow-[var(--shadow-material-1)] transition-all duration-500 ease-out hover:-translate-y-1.5 hover:border-primary/20 hover:bg-surface hover:shadow-[var(--shadow-material-3)]",
        className
      )}
    >
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] bg-surface-container border border-surface-border group-hover:border-primary/30 transition-all duration-500 shadow-[var(--shadow-material-1)] group-hover:shadow-[var(--shadow-material-2)]">
        
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-transparent group-hover:from-primary/10 group-hover:to-primary/5 transition-colors duration-500"></div>

        {icon ? (
          <div className="relative z-10 text-gray-500 group-hover:text-primary transition-colors duration-300 transform group-hover:scale-110">
            {icon}
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="relative z-10 h-8 w-8 sm:h-12 sm:w-12 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md" 
            loading="lazy" 
          />
        ) : null}
      </div>
      <span className="font-heading font-bold text-foreground text-[11px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full text-center group-hover:text-primary transition-colors">
        {name}
      </span>
    </Link>
  )
}
