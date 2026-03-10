"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "./badge"
import { Button, cn } from "./button"
import { Heart, Star, ShoppingCart, Check } from "lucide-react"
import { useCart } from "@/contexts/CartContext"

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  discountBadge?: string;
  imageUrl: string;
  rating?: number;
  reviewsCount?: number;
  className?: string;
}

export function ProductCard({
  id,
  title,
  price,
  oldPrice,
  discountBadge,
  imageUrl,
  rating,
  reviewsCount,
  className,
}: ProductCardProps) {
  const { addItem } = useCart()
  const [isAdded, setIsAdded] = React.useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to product detail
    await addItem(id, 1)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-3xl bg-surface border border-surface-hover transition-all duration-300 hover:border-primary/30 hover:shadow-premium hover:-translate-y-1 touch-manipulation", className)}>
      <Link href={`/product/${id}`} className="relative aspect-[4/3] sm:aspect-[3/2] w-full overflow-hidden bg-surface-lighter">

        {/* Placeholder for Next Image */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {/* Using object-contain for now but landscape container forces a wider look */}
          <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          {discountBadge && (
            <Badge variant="secondary" className="bg-secondary text-white font-bold px-2.5 py-1 shadow-lg shadow-secondary/20 rounded-lg">
              {discountBadge}
            </Badge>
          )}
        </div>

        {/* Favorite Icon */}
        <button className="absolute top-3 left-3 p-2 rounded-full bg-background/80 backdrop-blur-md text-gray-400 hover:text-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:opacity-100 shadow-md ring-1 ring-white/10 z-10">
          <Heart className="w-5 h-5 transition-transform active:scale-95" />
        </button>

        {/* Subtle premium gradient overlay on image hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Link>

      <div className="flex flex-col flex-1 p-4 sm:p-5 relative z-20 bg-surface">
        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mb-2 text-[11px] font-semibold text-yellow-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-gray-300">{rating} <span className="mr-1 hidden sm:inline text-gray-500">({reviewsCount})</span></span>
          </div>
        )}

        <Link href={`/product/${id}`} className="block flex-1 mb-3">
          <h3 className="text-sm sm:text-base font-heading font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors text-foreground">
            {title}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-surface-hover divide-surface-hover">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-heading font-black tracking-tight text-primary drop-shadow-sm">{price} <span className="text-sm">ج.م</span></span>
            </div>
            {oldPrice && (
              <span className="text-xs font-heading text-gray-500 line-through">{oldPrice} ج.م</span>
            )}
            {!oldPrice && <span className="h-4"></span> /* Maintain consistent height */}
          </div>

          <Button
            size="icon"
            className={`h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-2xl shadow-lg transition-all active:scale-95 ${isAdded
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
              : "shadow-primary/20 group-hover:shadow-primary/40"
              }`}
            aria-label="أضف للسلة"
            onClick={handleAddToCart}
          >
            {isAdded ? <Check className="w-5 h-5 text-white" /> : <ShoppingCart className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
