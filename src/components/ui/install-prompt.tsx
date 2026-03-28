"use client"

import * as React from "react"
import { Download, QrCode, ExternalLink } from "lucide-react"

export function InstallPrompt() {
  const [isStandalone, setIsStandalone] = React.useState(false)
  const [appUrl, setAppUrl] = React.useState("https://fi-elsekka.vercel.app")

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const isModeStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://")

    setIsStandalone(isModeStandalone)
    setAppUrl(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin || "https://fi-elsekka.vercel.app")
  }, [])

  if (isStandalone) {
    return null
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&format=svg&data=${encodeURIComponent(appUrl)}`

  return (
    <div className="pointer-events-none fixed bottom-6 left-6 z-[90] hidden md:block">
      <div className="pointer-events-auto w-[230px] rounded-[28px] border border-surface-hover bg-surface/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-primary">
          <div className="rounded-2xl bg-primary/10 p-2.5">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">حمّل التطبيق</p>
            <p className="text-[11px] text-gray-500">امسح الـ QR وافتح التطبيق بسرعة</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-surface-hover bg-white p-3">
          <img
            src={qrUrl}
            alt="QR لتحميل تطبيق في السكة"
            className="mx-auto h-40 w-40 rounded-xl"
            loading="lazy"
          />
        </div>

        <a
          href={appUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90"
        >
          حمل التطبيق
          <Download className="h-4 w-4" />
        </a>

        <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-500">
          أو افتح الرابط مباشرة
          <ExternalLink className="h-3.5 w-3.5" />
        </p>
      </div>
    </div>
  )
}
