"use client"

import Link from "next/link"
import Image from "next/image"
import { Button, cn } from "./button"
import { Clock3, Store, UtensilsCrossed } from "lucide-react"

type RestaurantCardProps = {
  id: string
  name: string
  shortDescription?: string | null
  cuisine?: string | null
  imageUrl?: string | null
  isAvailable?: boolean
  className?: string
}

export function RestaurantCard({
  id,
  name,
  shortDescription,
  cuisine,
  imageUrl,
  isAvailable = true,
  className,
}: RestaurantCardProps) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-[30px] border border-surface-border bg-surface shadow-[var(--shadow-material-1)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-material-2)]",
        className
      )}
    >
      <Link href={`/restaurants/${id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-surface-container">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 50vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-500">
              <UtensilsCrossed className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent p-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ${isAvailable ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
              {isAvailable ? "متاح الآن" : "مغلق حاليًا"}
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 text-base font-black text-foreground md:text-lg">{name}</h3>
            {cuisine ? (
              <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
                {cuisine}
              </span>
            ) : null}
            <p className="mt-2 line-clamp-2 min-h-[48px] text-xs leading-6 text-gray-500 md:text-sm">
              {shortDescription || "منيو متجدد ومنظم جوه في السكة، ادخل شوف اللي بيقدمه المطعم واطلب بسهولة."}
            </p>
          </div>
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary md:h-12 md:w-12">
            <Store className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t material-divider pt-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 md:text-xs">
            <Clock3 className="h-3.5 w-3.5" />
            الإدارة بتتابع وقت التوصيل مع المطعم
          </span>
          <Button asChild className="h-11 rounded-2xl px-4 text-sm font-black">
            <Link href={`/restaurants/${id}`}>ادخل شوف اللي بيقدمه</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
