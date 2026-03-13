"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShoppingBag, Phone } from "lucide-react"

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

// Particle that floats up
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-full bg-primary/60 animate-bounce"
      style={style}
    />
  )
}

export default function OrderSuccessPage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 200)
    return () => { clearTimeout(t1) }
  }, [])

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

        <div
          className={`w-full max-w-lg text-center transition-all duration-700 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Motorcycle animation */}
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

            {/* Motorcycle — continuous back and forth */}
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

          {/* Headline */}
          <div
            className={`transition-all duration-700 delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground mb-3 leading-tight">
              طلبك في الطريق! 🚀
            </h1>

            {/* Motivational message card */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-3xl p-6 mb-6 text-right shadow-xl shadow-primary/5">
              <p className="text-lg font-bold text-foreground leading-relaxed mb-3">
                🏍️ المندوب انطلق نحوك!
              </p>
              <p className="text-gray-500 leading-relaxed text-sm sm:text-base">
                طلبك تحت أيدينا دلوقتي وماشي في أسرع وقت. المندوب الشاطر بتاعنا هيكون عندك في أقرب وقت ممكن.
              </p>
              <div className="mt-4 pt-4 border-t border-primary/10">
                <div className="flex items-center gap-2 text-amber-400">
                  <Phone className="w-4 h-4 shrink-0" />
                  <p className="text-sm font-bold">
                    خلّي بالك من موبايلك — المندوب هيتصل بيك عشان يتأكد من الموعد والعنوان
                  </p>
                </div>
              </div>
            </div>

            {/* Steps tracker */}
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

            {/* CTA Buttons */}
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
      </main>
      <Footer />
    </>
  )
}
