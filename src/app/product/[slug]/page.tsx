"use client"

import * as React from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Star, ShieldCheck, Truck, ChevronRight, Check, Minus, Plus, ShoppingCart, Tag } from "lucide-react"
import { fetchProductDetails, Product } from "@/services/productsService"
import { useCart } from "@/contexts/CartContext"
import { DiscountCodeInput } from "@/components/ui/discount-code-input"

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()

  const [quantity, setQuantity] = React.useState(1)
  const [isAdded, setIsAdded] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
  const [appliedDiscountPrice, setAppliedDiscountPrice] = React.useState<number | null>(null)
  const [appliedDiscountLabel, setAppliedDiscountLabel] = React.useState<string | null>(null)

  React.useEffect(() => {
    const t = setTimeout(() => setIsMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const handleAddToCart = async () => {
    if (dbProduct) {
      await addItem(dbProduct.id, quantity, appliedDiscountPrice)
    }
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleBuyNow = async () => {
    if (dbProduct) {
      await addItem(dbProduct.id, quantity, appliedDiscountPrice)
    }
    router.push("/cart")
  }

  const slugOrId = typeof params.slug === 'string' ? params.slug : ''

  const [dbProduct, setDbProduct] = React.useState<Product | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

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
      description: dbProduct.description || "لا يوجد وصف متاح لهذا المنتج حالياً.",
      specs: dbProduct.product_specifications && dbProduct.product_specifications.length > 0
        ? dbProduct.product_specifications.map(s => ({ label: s.label, value: s.description }))
        : [
          { label: "الماركة", value: dbProduct.categories?.name || "عام" },
        ],
      features: dbProduct.specifications?.features || [
        "جودة عالية ومضمونة",
        "توصيل سريع",
        "دفع عند الاستلام",
      ],
      images: dbProduct.specifications?.images || [
        dbProduct.image_url || dbProduct.specifications?.image_url || "https://th.bing.com/th/id/OIG3.C_W_T_P_j_B_k_O_d_J_?pid=ImgGn",
        "https://th.bing.com/th/id/OIG2.u.R6D_r_N7J7L0_W0_x_?pid=ImgGn",
        "https://th.bing.com/th/id/OIG1.3T.W.G_A_u2z4O6.7Z1Y?pid=ImgGn",
      ],
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

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex-1 pb-24 md:pb-8 bg-background flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
          <nav className="flex text-sm text-gray-400" aria-label="Breadcrumb">
            <ol className="inline-flex items-center gap-1 rtl:space-x-reverse">
              <li><Link href="/" className="hover:text-foreground">الرئيسية</Link></li>
              <li className="text-gray-600">/</li>
              <li><Link href="/categories" className="hover:text-foreground">{product.category_name}</Link></li>
              <li className="text-gray-600"><ChevronRight className="w-3 h-3" /></li>
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
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-[4/3] w-24 sm:w-28 shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeImage === idx
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
                  <Badge variant="secondary" className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-3 py-1 shadow-md shadow-rose-500/20">
                    {product.discountAmount}
                  </Badge>
                )}
                <div className="flex items-center gap-1.5 text-xs text-yellow-500 bg-surface border border-surface-hover px-3 py-1.5 rounded-full font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{product.rating}</span>
                  <span className="text-gray-400 font-medium">({product.reviewsCount} تقييم)</span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-heading font-black text-foreground mb-6 leading-[1.3]">
                {product.title}
              </h1>

              {/* Price block */}
              <div className="flex items-end gap-3 mb-6 p-5 rounded-2xl bg-surface-light border border-surface-hover shadow-sm">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm font-medium mb-1">السعر الحالي</span>
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
              <div className="mb-6 flex items-center gap-2 text-sm font-medium">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </div>
                <span className="text-emerald-500">{product.stock}</span>
              </div>

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
                      <span className="text-sm font-bold text-gray-400">الكمية</span>
                      <div className="flex items-center rounded-2xl border border-surface-hover bg-background h-12 shadow-inner">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-5 h-full text-gray-400 hover:text-foreground hover:bg-surface-hover rounded-e-2xl active:scale-90 transition-all"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-heading font-black text-xl select-none">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="px-5 h-full text-gray-400 hover:text-foreground hover:bg-surface-hover rounded-s-2xl active:scale-90 transition-all"
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

                    {/* Buy Now button — unchanged (blue) */}
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full h-14 rounded-2xl text-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all active:scale-95"
                      onClick={handleBuyNow}
                    >
                      اخلص واشتري دلوقتي
                    </Button>

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
                    <p className="text-xs text-gray-400 leading-relaxed">عاين المنتج براحتك قبل ما تدفع أي حاجة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface/50 border border-surface-hover hover:border-primary/30 transition-colors">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-foreground mb-1">توصيل سريع ومضمون</p>
                    <p className="text-xs text-gray-400 leading-relaxed">هنعرفك مصاريف الشحن بالضبط قبل التأكيد</p>
                  </div>
                </div>
              </div>

              {/* Description & Specs */}
              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-bold mb-3 pb-2 border-b border-surface-hover">عن المنتج</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">{product.description}</p>
                  <ul className="mt-4 space-y-2">
                    {product.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
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
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 h-full text-gray-400 hover:text-white hover:bg-surface-hover rounded-e-2xl active:scale-90 transition-all">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-heading font-black text-lg select-none">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-4 h-full text-gray-400 hover:text-white hover:bg-surface-hover rounded-s-2xl active:scale-90 transition-all">
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
          </div>

        </div>
      </div>

      <Footer />
    </>
  )
}
