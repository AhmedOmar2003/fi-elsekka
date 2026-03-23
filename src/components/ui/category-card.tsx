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
        "group flex flex-col items-center gap-3 rounded-3xl px-2 py-3 transition-all duration-300 ease-out hover:-translate-y-1",
        className
      )}
    >
      <div className="relative flex h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface border border-surface-hover transition-all duration-300 shadow-[var(--shadow-material-1)] group-hover:border-primary/25 group-hover:shadow-[var(--shadow-material-2)]">
        
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors duration-300"></div>

        {icon ? (
          <div className="relative z-10 text-gray-500 group-hover:text-primary transition-colors duration-300 transform group-hover:scale-105">
            {icon}
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="relative z-10 h-8 w-8 sm:h-11 sm:w-11 object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md" 
            loading="lazy" 
          />
        ) : null}
      </div>
      <span className="font-heading font-semibold text-foreground text-[11px] sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full text-center group-hover:text-primary transition-colors">
        {name}
      </span>
    </Link>
  )
}
