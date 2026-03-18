"use client"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShoppingBag, Phone, Timer, XCircle, CheckCircle2 } from "lucide-react"
import { cancelOrderByCustomer, confirmOrderGracePeriod } from "@/services/ordersService"
import { toast } from "sonner"

function MotorcycleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 40"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {/* Rear wheel */}
      <circle cx="12" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="12" cy="30" r="3" />
      {/* Front wheel */}
      <circle cx="52" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="52" cy="30" r="3" />
      {/* Body / frame */}
      <path
        d="M12 30 L18 18 L28 18 L36 12 L48 18 L52 30"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Seat / fairing */}
      <path
        d="M22 18 L30 10 L40 10 L48 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Handlebar */}
      <path d="M50 14 L56 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rider helmet */}
      <circle cx="34" cy="10" r="4" />
      {/* Speed lines */}
      <line x1="2" y1="20" x2="10" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <line x1="0" y1="25" x2="8" y2="25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <line x1="2" y1="30" x2="8" y2="30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
    </svg>
  )
}

function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-full bg-primary/60 animate-bounce"
      style={style}
    />
  )
}

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const awaitingQuote = searchParams.get("awaitingQuote") === "1"

  const [showBike, setShowBike] = useState(false)
  
  // Grace period state
  const GRACE_PERIOD_SECONDS = 300 // 5 minutes
  const [showOverlay, setShowOverlay] = useState(!!orderId && !awaitingQuote)
  const [timeLeft, setTimeLeft] = useState(GRACE_PERIOD_SECONDS)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)

  // Countdown timer logic
  useEffect(() => {
    if (awaitingQuote) return
    if (!showOverlay || isCancelled) return

    if (timeLeft <= 0) {
      // Time's up -> hide overlay, show bike, and confirm grace period is over
      setShowOverlay(false)
      setTimeout(() => setShowBike(true), 100)
      if (orderId) confirmOrderGracePeriod(orderId)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [showOverlay, timeLeft, isCancelled])

  // Start bike animation immediately if no orderId (e.g. direct visit)
  useEffect(() => {
    if (awaitingQuote) return
    if (!orderId) {
      const t1 = setTimeout(() => setShowBike(true), 200)
      return () => clearTimeout(t1)
    }
  }, [awaitingQuote, orderId])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleKeepOrder = async () => {
    setShowOverlay(false)
    setTimeout(() => setShowBike(true), 200)
    if (orderId) {
      await confirmOrderGracePeriod(orderId)
    }
  }

  const handleCancelOrder = async () => {
    if (!orderId) return
    setIsCancelling(true)
    
    const { error } = await cancelOrderByCustomer(orderId, 'grace_period')
    
    setIsCancelling(false)
    
    if (error) {
      toast.error("حدث خطأ أثناء إلغاء الطلب، يرجى المحاولة مرة أخرى أو التواصل مع الدعم.")
      return
    }
    
    setIsCancelled(true)
    setShowOverlay(false)
  }

  if (isCancelled) {
    return (
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <XCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-4">تم إلغاء الطلب 😔</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          تم إلغاء طلبك بنجاح. لو حابب تتسوق تاني أو تطلب منتجات مختلفة، احنا دايماً في الخدمة!
        </p>
        <Link href="/">
          <button className="flex items-center justify-center gap-2 mx-auto bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20">
            <ShoppingBag className="w-5 h-5" />
            العودة للتسوق
          </button>
        </Link>
      </div>
    )
  }

  if (awaitingQuote) {
    return (
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
          <Timer className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-4">تم استلام طلب التسعير بنجاح</h1>
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-right shadow-premium">
          <p className="text-lg font-black text-foreground">انتظر عدة دقائق قبل الضغط على تأكيد الطلب</p>
          <p className="mt-3 text-sm leading-8 text-gray-500">
            الإدارة ستراجع تفاصيل طلبك أولًا، ثم سترسل لك تسعيرة المنتجات مع التوصيل. بعد وصول التسعيرة سيظهر لك زر تأكيد الطلب الحقيقي،
            وعند ضغطه فقط تبدأ مهلة الخمس دقائق المعتادة.
          </p>
          <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
            <p className="text-xs font-black text-amber-500">ما الذي سيحدث بعد ذلك؟</p>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              عندما يتم تسعير الطلب ستصلك إشعارة، وستجد نافذة واضحة داخل طلباتك تعرض السعر الكامل وتطلب منك إما تأكيد الطلب أو رفضه.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/orders">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 transition-all text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20">
              تابع طلباتي
            </button>
          </Link>
          <Link href="/">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-surface-border active:scale-95 transition-all text-foreground font-bold px-8 py-3.5 rounded-2xl">
              العودة للرئيسية
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* GRACE PERIOD OVERLAY */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium max-w-md w-full text-center relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600"></div>
            
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
              <Timer className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>
            
            <h2 className="text-2xl font-black text-foreground mb-3">أمامك 5 دقائق لإلغاء طلبك ⏳</h2>
            
            <p className="text-gray-500 mb-6 text-sm sm:text-base leading-relaxed">
              لو اتلخبطت في الطلب أو حابب تطلب حاجة تانية وتعدل منتجاتك، تقدر تلغي الطلب دلوقتي بكل سهولة قبل ما المندوب يتحرك.
            </p>
            
            <div className="text-4xl font-black text-amber-500 mb-8 font-mono tracking-wider">
              {formatTime(timeLeft)}
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleKeepOrder}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-primary/20"
              >
                <CheckCircle2 className="w-5 h-5" />
                لا، كمل الطلب! (أنا واثق فيكم)
              </button>
              
              <button 
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-rose-500/10 text-rose-500 border border-surface-border hover:border-rose-500/30 font-bold px-6 py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isCancelling ? (
                  <div className="w-5 h-5 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    إلغاء الطلب
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS ANIMATION (Motorcycle) */}
      <div className={`w-full max-w-lg text-center transition-all duration-700 ${showBike ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative h-40 mb-4 flex items-center justify-center overflow-hidden">
          {/* Road */}
          <div className="absolute bottom-6 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {/* Dashes on road */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-0.5 w-6 bg-primary/20"
                style={{ animation: `pulse 1s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>

          <style>{`
            @keyframes bikeRide {
              0%   { transform: translateX(-60px) scaleX(1); }
              48%  { transform: translateX(60px) scaleX(1); }
              50%  { transform: translateX(60px) scaleX(-1); }
              98%  { transform: translateX(-60px) scaleX(-1); }
              100% { transform: translateX(-60px) scaleX(1); }
            }
          `}</style>
          <div style={{ animation: 'bikeRide 2.8s ease-in-out infinite' }}>
            <MotorcycleIcon className="w-32 h-24 text-primary drop-shadow-lg" />
          </div>
        </div>

        <div className={`transition-all duration-700 delay-300 ${showBike ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-3 leading-tight">
            طلبك في الطريق! 🚀
          </h1>

          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 mb-6 text-right shadow-xl shadow-primary/5">
            <p className="text-lg font-bold text-foreground leading-relaxed mb-3">
              🏍️ المندوب انطلق نحوك!
            </p>
            <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
              طلبك تحت أيدينا دلوقتي وماشي في أسرع وقت. المندوب الشاطر بتاعنا هيكون عندك في أقرب وقت ممكن لأننا نقدر ثقتك فينا.
            </p>
            <div className="mt-4 pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2 text-amber-500">
                <Phone className="w-4 h-4 shrink-0" />
                <p className="text-sm font-bold">
                  خلّي بالك من موبايلك — المندوب هيتصل بيك عشان يتأكد من العنوان
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: "✅", label: "تأكيد الطلب", done: true },
              { icon: "🏍️", label: "المندوب في الطريق", done: true },
              { icon: "📦", label: "تم التوصيل", done: false },
            ].map((step, i) => (
              <div
                key={i}
                className={`rounded-2xl p-3 border text-center transition-all ${step.done
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-surface-hover/50 border-surface-hover text-gray-500'
                  }`}
              >
                <div className="text-2xl mb-1">{step.icon}</div>
                <p className="text-xs font-bold">{step.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 transition-all text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/20">
                <ShoppingBag className="w-5 h-5" />
                رجّع التسوق
              </button>
            </Link>
            <Link href="/orders">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-surface-border active:scale-95 transition-all text-foreground font-bold px-8 py-3.5 rounded-2xl">
                تابع طلباتي
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function OrderSuccessPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <Particle
            key={i}
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.5 + i * 0.2}s`,
              opacity: 0.4,
            }}
          />
        ))}

        <Suspense fallback={<div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
