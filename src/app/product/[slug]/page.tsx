"use client"

import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Star, ShieldCheck, Truck, ChevronRight, Check, Minus, Plus, ShoppingCart, Tag, Camera, Send, MessageSquare, X, Share2, Copy } from "lucide-react"
import { fetchProductDetails, Product } from "@/services/productsService"
import { fetchProductReviews, calcReviewStats, createReview, checkUserPurchased, checkUserReviewed, uploadReviewImage, Review, ReviewStats } from "@/services/reviewsService"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { DiscountCodeInput } from "@/components/ui/discount-code-input"
import { toast } from "sonner"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [quantity, setQuantity] = React.useState(1)
  const [isAdded, setIsAdded] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isShareSheetOpen, setIsShareSheetOpen] = React.useState(false)
  const [shareUrl, setShareUrl] = React.useState("")
  
  const [appliedDiscountPrice, setAppliedDiscountPrice] = React.useState<number | null>(null)
  const [appliedDiscountLabel, setAppliedDiscountLabel] = React.useState<string | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href)
    }
  }, [])

  const handleAddToCart = async () => {
    if (dbProduct) {
      await addItem(dbProduct.id, quantity, appliedDiscountPrice)
    }
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleBuyNow = async () => {
    if (!dbProduct) return;
    const searchParams = new URLSearchParams();
    searchParams.set("buyNow", dbProduct.id);
    searchParams.set("qty", quantity.toString());
    if (appliedDiscountPrice !== null) {
      searchParams.set("price", appliedDiscountPrice.toString());
    }
    router.push(`/checkout?${searchParams.toString()}`);
  }

  const copyShareLink = React.useCallback(async (targetLabel?: string) => {
    if (!shareUrl) {
      toast.error("لسه الرابط مش جاهز")
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success(targetLabel ? `نسخت الرابط علشان تشاركه على ${targetLabel} ✨` : "تم نسخ الرابط ✨")
    } catch {
      toast.error("مقدرتش أنسخ الرابط، جرب تاني")
    }
  }, [shareUrl])

  const openShareUrl = React.useCallback((targetUrl: string) => {
    if (typeof window !== "undefined") {
      window.open(targetUrl, "_blank", "noopener,noreferrer")
    }
  }, [])

  const slugOrId = typeof params.slug === 'string' ? params.slug : ''

  const [dbProduct, setDbProduct] = React.useState<Product | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const normalizedSpecs = React.useMemo(() => {
    if (!dbProduct) return []

    if (Array.isArray(dbProduct.product_specifications) && dbProduct.product_specifications.length > 0) {
      return dbProduct.product_specifications.map((spec) => ({
        label: spec.label,
        value: spec.description,
      }))
    }

    const fallbackSpecs = Array.isArray(dbProduct.specifications?.custom_specs)
      ? dbProduct.specifications.custom_specs
      : []

    return fallbackSpecs
      .filter((spec: any) => spec?.label?.trim() && (spec?.description || spec?.value || '').trim())
      .map((spec: any) => ({
        label: spec.label.trim(),
        value: String(spec.description || spec.value).trim(),
      }))
  }, [dbProduct])

  React.useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      const data = await fetchProductDetails(slugOrId)
      setDbProduct(data)
      setIsLoading(false)
    }

    if (slugOrId) {
      loadProduct()
    } else {
      setIsLoading(false)
    }
  }, [slugOrId])

  // ── Reviews state ─────────────────────────────────────────
  const [reviews, setReviews] = React.useState<Review[]>([])
  const [reviewStats, setReviewStats] = React.useState<ReviewStats>({ averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [reviewsLoading, setReviewsLoading] = React.useState(true)
  const [canReview, setCanReview] = React.useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = React.useState(false)
  const [showReviewForm, setShowReviewForm] = React.useState(false)

  // Review form state
  const [reviewRating, setReviewRating] = React.useState(5)
  const [reviewComment, setReviewComment] = React.useState("")
  const [reviewImages, setReviewImages] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)

  // Load reviews function
  const loadReviews = React.useCallback(async () => {
    if (!slugOrId) return
    
    setReviewsLoading(true)
    const data = await fetchProductReviews(slugOrId)
    setReviews(data)
    setReviewStats(calcReviewStats(data))
    setReviewsLoading(false)

    if (user) {
      const [purchased, reviewed] = await Promise.all([
        checkUserPurchased(user.id, slugOrId),
        checkUserReviewed(user.id, slugOrId),
      ])
      setCanReview(purchased && !reviewed)
      setAlreadyReviewed(reviewed)
    }
  }, [slugOrId, user])

  // Load reviews when product is available
  React.useEffect(() => {
    loadReviews()
  }, [loadReviews])

  // Refetch reviews when window gains focus (e.g. after admin deletes in another tab)
  React.useEffect(() => {
    const handleFocus = () => {
      loadReviews()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadReviews])

  const handleSubmitReview = async () => {
    if (!user || !dbProduct) return
    setIsSubmitting(true)

    const { data, error } = await createReview(
      user.id,
      dbProduct.id,
      reviewRating,
      reviewComment,
      reviewImages,
      (user as any).user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم'
    )

    if (error) {
      toast.error("حصلت مشكلة", { description: "جرب تاني بعد شوية" })
    } else if (data) {
      setReviews(prev => [data, ...prev])
      setReviewStats(calcReviewStats([data, ...reviews]))
      setShowReviewForm(false)
      setCanReview(false)
      setAlreadyReviewed(true)
      setReviewComment("")
      setReviewImages([])
      setReviewRating(5)
      toast.success("شكراً على تقييمك! 🎉", { description: "رأيك مهم ليا وهيساعد ناس تاني" })
    }
    setIsSubmitting(false)
  }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (reviewImages.length >= 3) {
      toast.error("أقصى عدد صور هو 3")
      return
    }
    setIsUploading(true)
    const url = await uploadReviewImage(file)
    if (url) {
      setReviewImages(prev => [...prev, url])
    } else {
      toast.error("فشل رفع الصورة")
    }
    setIsUploading(false)
  }


  const product = dbProduct ? (() => {
    let price = dbProduct.price;
    let oldPrice: number | undefined = dbProduct.specifications?.old_price || undefined;
    let discountAmount = dbProduct.specifications?.discount_badge || undefined;

    if (dbProduct.discount_percentage && dbProduct.discount_percentage > 0) {
      price = Math.round(dbProduct.price * (1 - dbProduct.discount_percentage / 100));
      oldPrice = dbProduct.price;
      discountAmount = `وفر ${dbProduct.price - price} ج.م`;
    }

    return {
      title: dbProduct.name,
      price,
      oldPrice,
      discountAmount,
      isBestSeller: dbProduct.is_best_seller,
      rating: dbProduct.specifications?.rating || 4.9,
      reviewsCount: dbProduct.specifications?.reviews_count || 120,
      stock: dbProduct.stock_quantity ? `متوفر ${dbProduct.stock_quantity} قطعة` : (dbProduct.specifications?.stock || "متوفر"),
      stockQty: dbProduct.stock_quantity ?? null,
      description: dbProduct.description || "لا يوجد وصف متاح لهذا المنتج حالياً.",
      specs: normalizedSpecs.length > 0
        ? normalizedSpecs
        : [
          { label: "الماركة", value: dbProduct.categories?.name || "عام" },
        ],
      features: dbProduct.specifications?.features || [
        "جودة عالية ومضمونة",
        "توصيل سريع",
        "دفع عند الاستلام",
      ],
      images: [
        dbProduct.image_url,
        ...(dbProduct.images || [])
      ].filter(Boolean) as string[],
      category_name: dbProduct.categories?.name || "منتجات"
    };
  })() : {
    title: "سماعة بلوتوث لاسلكية عازلة للضوضاء",
    price: 450,
    oldPrice: 600,
    discountAmount: "وفر 150 ج.م",
    isBestSeller: false,
    rating: 4.9,
    reviewsCount: 312,
    stock: "متوفر 15 قطعة فقط",
    stockQty: null,
    description: "استمتع بتجربة صوتية لا مثيل لها مع سماعة البلوتوث اللاسلكية الجديدة. تصميم مريح للأذن، بطارية تدوم حتى 24 ساعة، وعزل تام للضوضاء الخارجية عشان تفصل براحتك.",
    specs: [
      { label: "الماركة", value: "SoundMax" },
      { label: "عمر البطارية", value: "24 ساعة" },
      { label: "الاتصال", value: "بلوتوث 5.2" },
      { label: "الضمان", value: "سنة واحدة" },
    ],
    features: [
      "صوت نقي وبيز قوي",
      "ميكروفون مزود بتقنية عزل الضوضاء",
      "تحكم باللمس",
      "مقاومة لرذاذ الماء والتعرق",
    ],
    images: [
      "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn",
      "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn",
      "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn",
    ],
    category_name: "إلكترونيات",
  }

  const [activeImage, setActiveImage] = React.useState(0)

  const shareTitle = React.useMemo(() => `شوف ${dbProduct?.name || "المنتج ده"} على في السكة`, [dbProduct?.name])
  const shareMessage = React.useMemo(
    () => `المنتج ده عاجبني على في السكة 👇\n${dbProduct?.name || product.title}`,
    [dbProduct?.name, product.title]
  )

  const handleNativeShare = React.useCallback(async () => {
    if (!shareUrl) {
      toast.error("لسه الرابط مش جاهز")
      return
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
          url: shareUrl,
        })
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setIsShareSheetOpen(true)
        }
      }
      return
    }

    setIsShareSheetOpen(true)
  }, [shareMessage, shareTitle, shareUrl])

  const shareTargets = React.useMemo(() => {
    if (!shareUrl) return []

    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(`${shareMessage}\n${shareUrl}`)
    const encodedTitle = encodeURIComponent(shareTitle)

    return [
      {
        label: "واتساب",
        emoji: "🟢",
        helper: "ابعتها لأي حد بسرعة",
        action: () => openShareUrl(`https://wa.me/?text=${encodedText}`),
      },
      {
        label: "فيسبوك",
        emoji: "🔵",
        helper: "انشرها على فيسبوك",
        action: () => openShareUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
      },
      {
        label: "X / تويتر",
        emoji: "⚫",
        helper: "شاركها على X",
        action: () => openShareUrl(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`),
      },
      {
        label: "تيليجرام",
        emoji: "📨",
        helper: "ابعتها على تيليجرام",
        action: () => openShareUrl(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`),
      },
      {
        label: "إنستجرام",
        emoji: "📸",
        helper: "هننسخ الرابط وانت شاركه هناك",
        action: () => copyShareLink("إنستجرام"),
      },
      {
        label: "تيك توك",
        emoji: "🎵",
        helper: "هننسخ الرابط وانت شاركه هناك",
        action: () => copyShareLink("تيك توك"),
      },
    ]
  }, [copyShareLink, openShareUrl, shareMessage, shareTitle, shareUrl])

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 pb-24 md:pb-8 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb skeleton */}
            <div className="flex gap-2 items-center mb-6">
              <div className="h-4 w-16 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
              <div className="h-4 w-4 rounded-full bg-surface-hover" />
              <div className="h-4 w-24 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
              {/* Image gallery skeleton */}
              <div className="flex flex-col gap-3">
                <div className="aspect-square w-full rounded-3xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                <div className="flex gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-20 flex-1 rounded-2xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  ))}
                </div>
              </div>

              {/* Product details skeleton */}
              <div className="flex flex-col gap-4">
                <div className="h-5 w-24 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                <div className="h-8 w-3/4 rounded-xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                <div className="h-8 w-1/2 rounded-xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                <div className="h-12 w-40 rounded-2xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent mt-2" />
                <div className="h-px w-full bg-surface-hover my-2" />
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                    <div className={`h-4 rounded-lg bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent ${i % 2 === 0 ? 'w-48' : 'w-36'}`} />
                  </div>
                ))}
                <div className="flex gap-3 mt-4">
                  <div className="h-14 flex-1 rounded-2xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                  <div className="h-14 w-14 rounded-2xl bg-surface-hover relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />

      <main className="flex-1 pb-24 md:pb-8 bg-background">

        {/* Breadcrumbs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center gap-1 rtl:space-x-reverse">
              <li><Link href="/" className="hover:text-foreground">الرئيسية</Link></li>
              <li className="text-gray-400 dark:text-gray-600">/</li>
              <li><Link href="/categories" className="hover:text-foreground">{product.category_name}</Link></li>
              <li className="text-gray-400 dark:text-gray-600"><ChevronRight className="w-3 h-3" /></li>
              <li className="text-gray-500 line-clamp-1 max-w-[180px]">{product.title}</li>
            </ol>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* ── Image Gallery ──────────────────────────────────────────── */}
            <div className="lg:col-span-6 flex flex-col gap-4">

              {/* Main image */}
              <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full rounded-3xl bg-surface border border-surface-hover overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none z-10" />
                <img
                  src={product.images[activeImage]}
                  className="object-cover w-full h-full transform transition-transform duration-700 group-hover:scale-105"
                  alt={product.title}
                />
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`snap-start relative aspect-[4/3] w-[28vw] min-w-[80px] sm:w-28 shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImage === idx
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-surface-hover hover:border-gray-500 scale-95 opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img src={img} className="object-cover w-full h-full" alt="" />
                  </button>
                ))}
              </div>

            </div>

            {/* ── Product Info ────────────────────────────────────────────── */}
            <div className="lg:col-span-6 flex flex-col">

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {product.isBestSeller && (
                  <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1 shadow-md shadow-amber-500/20">
                    ⭐ الأكثر مبيعاً
                  </Badge>
                )}
                {product.discountAmount && (
                  <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1 shadow-md shadow-rose-500/20 border-rose-500">
                    {product.discountAmount}
                  </Badge>
                )}
                
                {/* Dynamic Rating Badge -> Scrolls to reviews */}
                <a 
                  href="#reviews" 
                  className="flex items-center gap-1.5 text-xs text-yellow-500 bg-surface border border-surface-hover px-3 py-1.5 rounded-full font-bold hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>{reviewsLoading ? '...' : reviewStats.averageRating || 'جديد'}</span>
                  {!reviewsLoading && reviewStats.totalReviews > 0 && (
                    <span className="text-gray-500 font-medium">({reviewStats.totalReviews} تقييم)</span>
                  )}
                </a>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-6 leading-[1.3]">
                {product.title}
              </h1>

              {/* Price block */}
              <div className="flex items-end gap-3 mb-6 p-5 rounded-2xl bg-surface-light border border-surface-hover shadow-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm font-medium mb-1">السعر الحالي</span>
                  <span className="font-heading text-4xl font-black text-primary tracking-tight">
                    {appliedDiscountPrice !== null ? appliedDiscountPrice : product.price} <span className="text-lg font-bold">ج.م</span>
                  </span>
                </div>
                {(appliedDiscountPrice !== null || product.oldPrice) && (
                  <span className="font-heading text-lg text-gray-500 line-through mb-1">
                    {appliedDiscountPrice !== null ? product.price : product.oldPrice} ج.م
                  </span>
                )}
              </div>

              {/* Discount Code Input */}
              {product.price > 0 && (
                <DiscountCodeInput
                  originalPrice={product.price}
                  userId={user?.id}
                  onDiscountApplied={(finalPrice, savedAmount, label) => {
                    setAppliedDiscountPrice(finalPrice);
                    setAppliedDiscountLabel(label);
                  }}
                  onDiscountRemoved={() => {
                    setAppliedDiscountPrice(null);
                    setAppliedDiscountLabel(null);
                  }}
                />
              )}

              {/* Stock indicator */}
              {(() => {
                const qty = product.stockQty
                const isOutOfStock = qty !== null && qty <= 0
                const isLowStock = qty !== null && qty > 0 && qty <= 5
                const isInStock = qty === null || qty > 5

                if (isOutOfStock) {
                  return (
                    <div className="mb-6 flex items-center gap-2 text-sm font-medium">
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
                      <span className="text-rose-500 font-bold">غير متوفر حالياً — نفذت الكمية</span>
                    </div>
                  )
                }
                if (isLowStock) {
                  return (
                    <div className="mb-6 flex items-center gap-2 text-sm font-medium">
                      <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </div>
                      <span className="text-amber-500 font-bold">باقي {qty} قطع فقط — اطلب قبل ما تنتهي!</span>
                    </div>
                  )
                }
                return (
                  <div className="mb-6 flex items-center gap-2 text-sm font-medium">
                    <div className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </div>
                    <span className="text-emerald-500">{product.stock}</span>
                  </div>
                )
              })()}

              {/* ══ DESKTOP CTA CONTAINER ══════════════════════════════════
                   Soft green border wraps the purchase area for visibility.
                   Buttons are left EXACTLY AS-IS (colors, shapes, sizes).
                   ════════════════════════════════════════════════════════ */}
              <div
                className="hidden md:block mb-10"
                style={{
                  opacity: isMounted ? 1 : 0,
                  transform: isMounted ? "translateY(0)" : "translateY(16px)",
                  transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
                }}
              >
                {/* Outer glow / border ring */}
                <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-primary/50 via-emerald-400/10 to-transparent shadow-[0_4px_32px_rgba(16,185,129,0.12)]">
                  {/* Inner container */}
                  <div className="relative rounded-[calc(1.5rem-2px)] bg-surface/95 px-5 pt-5 pb-4 overflow-hidden">

                    {/* Faint ambient glow in background */}
                    <div className="absolute -top-12 -start-12 w-40 h-40 bg-primary/8 blur-3xl rounded-full pointer-events-none" />

                    {/* Section label */}
                    <p className="text-xs font-bold text-primary/80 uppercase tracking-widest mb-4">
                      أضف إلى طلبك
                    </p>

                    {/* Quantity row */}
                    <div className="flex items-center justify-between mb-5 px-0.5">
                      <span className="text-sm font-bold text-gray-500">الكمية</span>
                      <div className="flex items-center rounded-2xl border border-surface-hover bg-background h-12 shadow-inner">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-5 h-full text-gray-500 hover:text-foreground hover:bg-surface-hover rounded-e-2xl active:scale-90 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-heading font-black text-xl select-none">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-5 h-full text-gray-500 hover:text-foreground hover:bg-surface-hover rounded-s-2xl active:scale-90 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-primary/10 mb-4" />

                    {/* Add to Cart button — unchanged */}
                    <div className="mb-3">
                      <Button
                        size="lg"
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 gap-2"
                        onClick={handleAddToCart}
                      >
                        {isAdded ? <Check className="w-6 h-6" /> : <ShoppingCart className="w-6 h-6" />}
                        <span>{isAdded ? "تمت الإضافة بنجاح ✔" : "أضف للسلة"}</span>
                      </Button>
                    </div>

                    {/* Buy Now button */}
                    <button
                      className="w-full h-14 rounded-2xl text-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all active:scale-95 inline-flex items-center justify-center"
                      onClick={handleBuyNow}
                    >
                      اخلص واشتري دلوقتي
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShareSheetOpen(true)}
                      className="mt-3 w-full h-12 rounded-2xl border border-primary/20 bg-primary/5 text-primary font-bold inline-flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      شارك المنتج مع صحابك
                    </button>

                    {/* Trust note */}
                    <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      دفع كاش عند الاستلام &bull; مفيش بيانات بنكية مطلوبة
                    </p>

                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface/50 border border-surface-hover hover:border-emerald-500/30 transition-colors">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground mb-1">الدفع كاش عند الاستلام</p>
                    <p className="text-xs text-gray-500 leading-relaxed">عاين المنتج براحتك قبل ما تدفع أي حاجة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface/50 border border-surface-hover hover:border-primary/30 transition-colors">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground mb-1">توصيل سريع ومضمون</p>
                    <p className="text-xs text-gray-500 leading-relaxed">هنعرفك مصاريف الشحن بالضبط قبل التأكيد</p>
                  </div>
                </div>
              </div>

              {/* Description & Specs */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-bold mb-3 pb-2 border-b border-surface-hover">عن المنتج</h3>
                  <p className="text-gray-500 leading-relaxed text-sm md:text-base">{product.description}</p>
                  <ul className="mt-4 space-y-2">
                    {product.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                        <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-3 pb-2 border-b border-surface-hover">المواصفات</h3>
                  <div className="rounded-xl overflow-hidden border border-surface-hover divide-y divide-surface-hover">
                    {product.specs.map((spec: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center bg-surface px-4 py-3">
                        <span className="w-1/3 text-gray-500 text-sm">{spec.label}</span>
                        <span className="text-foreground text-sm font-medium mt-1 sm:mt-0">{spec.value || spec.description}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              </div>
            </div>

            {/* ── Reviews Section ────────────────────────────────────────── */}
            <div className="mt-16 pt-10 border-t border-surface-hover w-full" id="reviews">
              <div className="flex items-center gap-3 mb-8">
                <h3 className="text-2xl font-black text-foreground">تقييمات العملاء</h3>
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>

              {reviewsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  
                  {/* Stats Column - Now on the Right (lg:col-span-4) visually left in RTL */}
                  <div className="lg:col-span-4 flex flex-col gap-4 order-1">
                    <div className="bg-[#11161d] rounded-[2rem] p-8 border border-surface-hover shadow-sm">
                      <div className="text-center mb-8">
                        <span className="font-heading text-6xl font-black text-white block mb-4 leading-none">{reviewStats.averageRating}</span>
                        <div className="flex justify-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className={`w-6 h-6 ${star <= Math.round(reviewStats.averageRating) ? 'fill-[#ffc107] text-[#ffc107]' : 'fill-gray-200 text-gray-200 dark:fill-gray-800 dark:text-gray-800'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-gray-500">بناءً على {reviewStats.totalReviews} تقييم</p>
                      </div>

                      <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map(stars => {
                          const count = reviewStats.distribution[stars] || 0
                          const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0
                          return (
                            <div key={stars} className="flex items-center gap-4">
                              <div className="flex items-center gap-1 w-8 shrink-0 text-sm font-bold text-gray-400 justify-end">
                                <span>{stars}</span>
                              </div>
                              <div className="flex-1 h-3 bg-[#1e2532] rounded-full overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 left-0 bg-[#ffc107] rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="flex items-center gap-1 text-xs text-gray-500 w-8 shrink-0">
                                <Star className="w-3.5 h-3.5 fill-[#ffc107] text-[#ffc107]" />
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {canReview && !showReviewForm && (
                      <div className="bg-[#11161d] rounded-[2rem] p-6 border border-surface-hover flex flex-col gap-4 items-center">
                        <Button
                          onClick={() => setShowReviewForm(true)}
                          className="w-full h-14 rounded-2xl font-bold bg-[#10b981] text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 text-base"
                        >
                          اكتب تقييمك للمنتج
                        </Button>
                      </div>
                    )}

                    {alreadyReviewed && (
                      <div className="bg-[#0a2318] border border-[#10b981]/20 rounded-[2rem] p-8 text-center flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex flex-col items-center justify-center text-[#10b981]">
                          <Check className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-[#10b981] text-lg mb-1">شكراً!</p>
                          <p className="text-sm text-[#10b981]/80">إنت قيمت المنتج ده قبل كده.</p>
                        </div>
                      </div>
                    )}

                    {!user && (
                      <div className="bg-[#11161d] rounded-[2rem] p-6 text-center border border-surface-hover">
                        <p className="text-sm text-gray-400 mb-4">سجل دخول عشان تقدر تكتب تقييم</p>
                        <Button asChild variant="outline" className="w-full h-12 rounded-xl border-surface-hover text-white hover:bg-surface-hover">
                          <Link href="/login">تسجيل الدخول</Link>
                        </Button>
                      </div>
                    )}
                  </div>

                    {/* Reviews List & Form Column - Now on the left (lg:col-span-8) visually right in RTL to take more space */}
                    <div className="lg:col-span-8 flex flex-col gap-6 order-2">
                      
                      {/* Review Form */}
                      {showReviewForm && (
                        <div className="bg-[#11161d] rounded-3xl p-6 border border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative origin-top animate-in fade-in zoom-in-95 duration-200">
                          <button 
                            onClick={() => setShowReviewForm(false)}
                            className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 p-1 bg-surface-hover rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <h4 className="font-bold text-lg mb-4 text-foreground">تقييمك للمنتج</h4>
                          
                          {/* Star picker */}
                          <div className="flex gap-2 mb-6">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                              >
                                <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-[#ffc107] text-[#ffc107]' : 'fill-gray-200 text-gray-200 dark:fill-gray-800 dark:text-gray-800'}`} />
                              </button>
                            ))}
                          </div>

                          {/* Comment box */}
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="شاركنا رأيك في المنتج بصراحة (اختياري بس بيفرق معانا جداً)..."
                            className="w-full bg-[#0a0d14] border border-surface-hover rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px] resize-y mb-4"
                          />

                          {/* Image uploads */}
                          <div className="mb-6">
                            <p className="text-xs font-bold text-gray-500 mb-2">أضف صور للمنتج من تصويرك (اختياري - متاح 3 صور)</p>
                            <div className="flex gap-3 flex-wrap">
                              {reviewImages.map((url, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-surface-hover group">
                                  <img src={url} alt="Review" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              ))}
                              
                              {reviewImages.length < 3 && (
                                <label className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-surface-hover hover:border-primary/50 text-gray-400 hover:text-primary transition-colors cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                  {isUploading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
                                  ) : (
                                    <>
                                      <Camera className="w-6 h-6 mb-1" />
                                      <span className="text-[10px] font-bold">صورة</span>
                                    </>
                                  )}
                                  <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={isUploading} />
                                </label>
                              )}
                            </div>
                          </div>

                          <Button 
                            onClick={handleSubmitReview} 
                            disabled={isSubmitting || isUploading}
                            className="w-full h-12 rounded-xl font-bold bg-primary text-white gap-2"
                          >
                            {isSubmitting ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Send className="w-4 h-4 rtl:-scale-x-100" />
                                <span>نشر التقييم</span>
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* List of reviews */}
                      {reviews.length === 0 ? (
                        <div className="bg-[#11161d] rounded-3xl p-10 text-center border border-surface-hover flex flex-col items-center justify-center h-full mt-8">
                          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                          <h4 className="font-bold text-lg text-foreground mb-1">مفيش تقييمات لسه</h4>
                          <p className="text-gray-500 text-sm">كن أول شخص يشارك رأيه في المنتج ده!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 w-full mt-8">
                          {reviews.map((review) => (
                            <div key={review.id} className="bg-[#11161d] rounded-3xl p-6 border border-surface-hover transition-all w-full">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className="font-bold text-base text-white">{review.user_name || 'مستخدم'}</span>
                                    <span className="flex items-center gap-1 bg-[#0a2318] text-[#10b981] text-xs font-bold px-2 py-1 rounded-md">
                                      <Check className="w-3.5 h-3.5" />
                                      مشترى مؤكد
                                    </span>
                                  </div>
                                  <div className="flex gap-1 pl-1 text-[11px] text-gray-400 font-medium whitespace-nowrap">
                                    {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-[#ffc107] text-[#ffc107]' : 'fill-gray-200 text-gray-200 dark:fill-gray-800 dark:text-gray-800'}`} />
                                  ))}
                                </div>
                              </div>
                              
                              {review.comment && (
                                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mt-2 text-right">
                                  {review.comment}
                                </p>
                              )}

                              {review.images && review.images.length > 0 && (
                                <div className="flex gap-2 mt-4">
                                  {review.images.map((img, idx) => (
                                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-surface-hover hover:opacity-80 transition-opacity">
                                      <img src={img} alt="صورة التقييم" className="w-full h-full object-cover" loading="lazy" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
      </main>

      {/* ── MOBILE STICKY PURCHASE BAR ──────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          opacity: isMounted ? 1 : 0,
          transform: isMounted ? "translateY(0)" : "translateY(100%)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
      >
        {/* Gradient depth */}
        <div className="h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

        <div className="bg-background backdrop-blur-2xl border-t border-surface-hover px-4 pt-3 pb-7 shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">

          {/* Price + qty row */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">سعر الوحدة</span>
              <div className="flex items-baseline gap-2">
                <span className="font-heading font-black text-primary text-2xl leading-none">
                  {appliedDiscountPrice !== null ? appliedDiscountPrice : product.price} <span className="text-sm font-bold">ج.م</span>
                </span>
                {appliedDiscountPrice !== null && (
                  <span className="text-sm text-gray-500 line-through">{product.price} ج.م</span>
                )}
              </div>
              {appliedDiscountLabel && (
                <span className="text-[10px] text-primary font-bold mt-0.5">✅ {appliedDiscountLabel}</span>
              )}
            </div>
            <div className="flex items-center rounded-2xl border border-surface-hover bg-surface h-11 shadow-inner">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 h-full text-gray-500 hover:text-foreground hover:bg-surface-hover rounded-e-2xl active:scale-90 transition-all">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-heading font-black text-lg select-none">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 h-full text-gray-500 hover:text-foreground hover:bg-surface-hover rounded-s-2xl active:scale-90 transition-all">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {/* Add to Cart — green */}
            <button
              onClick={handleAddToCart}
              className={[
                "relative flex-1 h-14 rounded-2xl font-heading font-black text-base overflow-hidden transition-all duration-300 active:scale-[0.96] text-white",
                isAdded
                  ? "bg-emerald-600 shadow-lg shadow-emerald-600/30"
                  : "bg-primary shadow-[0_6px_24px_rgba(16,185,129,0.4)]",
              ].join(" ")}
            >
              <span className="flex items-center justify-center gap-2">
                {isAdded ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {isAdded ? "تمت الإضافة ✔" : "أضف للسلة"}
              </span>
            </button>

            {/* Buy Now — blue */}
            <button
              onClick={handleBuyNow}
              className="h-14 px-5 rounded-2xl font-heading font-black text-base text-white bg-blue-600 hover:bg-blue-700 shadow-[0_6px_24px_rgba(59,130,246,0.35)] active:scale-[0.96] transition-all duration-300"
            >
              اشتري ⚡
            </button>

            <button
              type="button"
              onClick={() => setIsShareSheetOpen(true)}
              className="h-14 w-14 shrink-0 rounded-2xl border border-primary/20 bg-primary/5 text-primary inline-flex items-center justify-center shadow-[0_6px_24px_rgba(16,185,129,0.12)] active:scale-[0.96] transition-all duration-300"
              aria-label="شارك المنتج"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>

      {isShareSheetOpen && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setIsShareSheetOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-[2rem] md:rounded-[2rem] border border-surface-hover bg-[#0b1016] p-5 md:p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-sm font-bold text-primary mb-1">شارك المنتج وخلي ناس أكتر تشوفه ✨</p>
                <h3 className="text-xl font-black text-white leading-snug">لو المنتج عاجبك ابعته لحد ممكن يستفيد بيه</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShareSheetOpen(false)}
                className="w-10 h-10 rounded-2xl border border-surface-hover text-gray-400 hover:text-white hover:bg-surface transition-colors inline-flex items-center justify-center shrink-0"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 mb-4">
              <p className="text-white font-bold line-clamp-2 mb-1">{product.title}</p>
              <p className="text-sm text-gray-400">رابط مباشر للمنتج من في السكة، وهننسخه لك فورًا لو المنصة محتاجة كده.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={handleNativeShare}
                className="col-span-2 h-12 rounded-2xl bg-primary text-white font-bold inline-flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
              >
                <Share2 className="w-5 h-5" />
                مشاركة سريعة
              </button>

              {shareTargets.map((target) => (
                <button
                  key={target.label}
                  type="button"
                  onClick={target.action}
                  className="rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-start hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-2 text-white font-bold mb-1">
                    <span className="text-lg leading-none">{target.emoji}</span>
                    <span>{target.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{target.helper}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => copyShareLink()}
                className="flex-1 h-11 rounded-2xl border border-surface-hover bg-surface text-white font-bold inline-flex items-center justify-center gap-2 hover:bg-surface-hover transition-colors"
              >
                <Copy className="w-4 h-4" />
                انسخ الرابط
              </button>
              <button
                type="button"
                onClick={() => setIsShareSheetOpen(false)}
                className="flex-1 h-11 rounded-2xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-colors"
              >
                تمام
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
