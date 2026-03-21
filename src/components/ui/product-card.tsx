"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button, cn } from "./button"
import { Heart, Star, ShoppingCart, Check } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useFavorites } from "@/contexts/FavoritesContext"

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  discountBadge?: string;
  imageUrl: string;
  rating?: number;
  reviewsCount?: number;
  productMode?: "single" | "bundle";
  bundleItems?: { name: string; quantity?: string; note?: string }[];
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
  productMode = "single",
  bundleItems = [],
  className,
}: ProductCardProps) {
  const { addItem } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isAdded, setIsAdded] = React.useState(false)
  const fav = isFavorite(id)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    await addItem(id, 1)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await toggleFavorite(id)
  }

  const isBundle = productMode === "bundle"
  const bundleSummary = bundleItems
    .slice(0, 2)
    .map((item) => item.name)
    .filter(Boolean)
    .join(" + ")

  return (
    <div className={cn("group flex flex-col overflow-hidden rounded-3xl bg-surface border border-surface-hover transition-all duration-300 hover:border-primary/30 hover:shadow-premium hover:-translate-y-1 touch-manipulation", className)}>
      <Link href={`/product/${id}`} className="relative aspect-[4/3] sm:aspect-[3/2] w-full overflow-hidden bg-surface-lighter">

        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        {/* Discount Badge */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          {isBundle && (
            <span className="inline-flex items-center rounded-full bg-primary text-white font-bold px-2.5 py-1 shadow-lg shadow-primary/20 text-xs">
              باكج
            </span>
          )}
          {discountBadge && (
            <span className="inline-flex items-center rounded-full bg-secondary text-white font-bold px-2.5 py-1 shadow-lg shadow-secondary/20 text-xs">
              {discountBadge}
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleToggleFav}
          aria-label={fav ? "إزالة من المفضلة" : "أضف للمفضلة"}
          className={cn(
            "absolute top-3 left-3 p-2 rounded-full backdrop-blur-md shadow-md ring-1 ring-black/5 z-10 transition-all duration-200 active:scale-90",
            fav
              ? "bg-secondary/10 text-secondary opacity-100"
              : "bg-background/80 text-gray-400 hover:text-secondary opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          )}
        >
          <Heart className={cn("w-5 h-5 transition-transform", fav && "fill-current")} />
        </button>

        {/* Subtle premium gradient overlay on image hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Link>

      <div className="flex flex-col flex-1 p-4 sm:p-5 relative z-20 bg-surface">
        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mb-2 text-[11px] font-semibold text-yellow-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-foreground">{rating} <span className="mr-1 hidden sm:inline text-gray-500">({reviewsCount})</span></span>
          </div>
        )}

        <Link href={`/product/${id}`} className="block flex-1 mb-3">
          <h3 className="text-sm sm:text-base font-heading font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors text-foreground">
            {title}
          </h3>
          {isBundle && (
            <p className="mt-2 text-[11px] sm:text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {bundleSummary ? `جواها: ${bundleSummary}` : `باكج فيها ${bundleItems.length} منتجات`}
            </p>
          )}
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2 border-t border-surface-hover divide-surface-hover">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-heading font-black tracking-tight text-primary drop-shadow-sm">{price} <span className="text-sm">ج.م</span></span>
            </div>
            {oldPrice && (
              <span className="text-xs font-heading text-gray-500 line-through">{oldPrice} ج.م</span>
            )}
            {!oldPrice && <span className="h-4"></span>}
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
