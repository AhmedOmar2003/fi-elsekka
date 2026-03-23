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
  return (
    <div className={cn("group relative flex h-full min-h-[284px] flex-col overflow-hidden rounded-[26px] border border-surface-border bg-surface-container-low shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 hover:shadow-premium hover:border-surface-border touch-manipulation sm:min-h-[320px] sm:rounded-3xl", className)}>
      <Link href={`/product/${id}`} className="relative aspect-[4/3] sm:aspect-[3/2] w-full overflow-hidden bg-surface-container">

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
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {isBundle && (
            <span className="inline-flex items-center rounded-full border border-emerald-700/20 bg-emerald-600 px-3 py-1 text-[11px] font-black tracking-wide text-white shadow-[var(--shadow-material-2)] dark:border-white/10 dark:bg-primary">
              باكج
            </span>
          )}
          {discountBadge && (
            <span className="inline-flex items-center rounded-full border border-rose-700/20 bg-rose-600 px-3 py-1 text-[11px] font-black tracking-wide text-white shadow-[var(--shadow-material-2)] dark:border-white/10 dark:bg-secondary">
              {discountBadge}
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleToggleFav}
          aria-label={fav ? "إزالة من المفضلة" : "أضف للمفضلة"}
          className={cn(
            "absolute top-3 left-3 z-10 rounded-full p-2 backdrop-blur-xl shadow-sm border border-white/20 transition-all duration-300 active:scale-90",
            fav
              ? "bg-secondary/10 text-secondary border-secondary/20 opacity-100"
              : "bg-background/60 text-foreground/60 hover:text-secondary hover:bg-background/90 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
          )}
        >
          <Heart className={cn("w-5 h-5 transition-transform", fav && "fill-current")} />
        </button>

        {/* Subtle premium gradient overlay on image hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Link>

      <div className="relative z-20 flex flex-1 flex-col bg-surface-container-low px-3 pb-2.5 pt-2.5 sm:p-5">
        {/* Rating */}
        {rating && (
          <div className="mb-1.5 inline-flex w-fit items-center gap-1 rounded-full border border-surface-border bg-surface-container px-2 py-1 text-[10px] font-medium transition-colors group-hover:bg-surface-container-high sm:mb-2 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
            <span className="text-foreground tracking-wide">{rating} <span className="mr-1 hidden sm:inline opacity-60">({reviewsCount})</span></span>
          </div>
        )}

        <Link href={`/product/${id}`} className="mb-0.5 block h-[33px] sm:h-[42px]">
          <h3 className="line-clamp-2 text-[12.5px] font-heading font-semibold leading-[1.35] text-foreground transition-colors group-hover:text-primary sm:text-base">
            {title}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-2 border-t material-divider pt-1">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] font-heading font-black tracking-tight text-primary sm:text-xl">{price} <span className="text-[11px] sm:text-sm">ج.م</span></span>
            </div>
            {oldPrice && (
              <span className="text-[11px] font-heading text-gray-500 line-through sm:text-xs">{oldPrice} ج.م</span>
            )}
            {!oldPrice && <span className="h-1.5 sm:h-2"></span>}
          </div>

          <Button
            size="icon"
            variant="primary"
            className={cn(
              "h-[42px] w-[42px] shrink-0 rounded-2xl bg-primary text-white shadow-[var(--shadow-material-2)] ring-1 ring-primary/15 transition-all duration-300 active:scale-90 hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[var(--shadow-material-3)] sm:h-12 sm:w-12",
              isAdded ? "bg-emerald-500 hover:bg-emerald-600 ring-emerald-500/20" : "border-primary/20"
            )}
            aria-label="أضف للسلة"
            onClick={handleAddToCart}
          >
            {isAdded ? <Check className="h-[17px] w-[17px] text-white sm:h-[18px] sm:w-[18px]" strokeWidth={2.4} /> : <ShoppingCart className="h-[17px] w-[17px] text-white sm:h-[18px] sm:w-[18px]" strokeWidth={2.2} />}
          </Button>
        </div>
      </div>
    </div>
  )
}
