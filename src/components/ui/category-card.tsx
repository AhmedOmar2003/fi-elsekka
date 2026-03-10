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
        "group flex flex-col items-center gap-3 rounded-3xl p-3 transition-all duration-300 hover:bg-surface-hover hover:shadow-premium hover:-translate-y-1",
        className
      )}
    >
      <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-surface to-surface-lighter border border-surface-hover group-hover:border-primary/40 transition-all duration-500 shadow-lg group-hover:shadow-primary/20">
        
        {/* Soft background glow */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500"></div>

        {icon ? (
          <div className="relative z-10 text-gray-400 group-hover:text-primary transition-colors duration-300 transform group-hover:scale-110">
            {icon}
          </div>
        ) : imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="relative z-10 h-10 w-10 sm:h-12 sm:w-12 object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-md" 
            loading="lazy" 
          />
        ) : null}
      </div>
      <span className="font-heading font-semibold text-foreground text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full text-center group-hover:text-primary transition-colors">
        {name}
      </span>
    </Link>
  )
}
