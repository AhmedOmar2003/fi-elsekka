"use client"

import * as React from "react"
import Link from "next/link"
import { Download, Share, PlusSquare, Smartphone, ArrowLeft, CheckCircle2 } from "lucide-react"

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function InstallAppPage() {
  const [isIOS, setIsIOS] = React.useState(false)
  const [isStandalone, setIsStandalone] = React.useState(false)
  const [isInstallReady, setIsInstallReady] = React.useState(false)
  const [isInstalling, setIsInstalling] = React.useState(false)
  const [installSucceeded, setInstallSucceeded] = React.useState(false)
  const deferredPrompt = React.useRef<DeferredInstallPrompt | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const userAgent = window.navigator.userAgent.toLowerCase()
    const modeStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://")

    setIsStandalone(modeStandalone)
    setIsIOS(/iphone|ipad|ipod/.test(userAgent))

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredPrompt.current = event as DeferredInstallPrompt
      setIsInstallReady(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt.current) return

    setIsInstalling(true)
    try {
      await deferredPrompt.current.prompt()
      const choice = await deferredPrompt.current.userChoice
      if (choice.outcome === "accepted") {
        setInstallSucceeded(true)
        setIsInstallReady(false)
      }
    } finally {
      deferredPrompt.current = null
      setIsInstalling(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-6">
      <div className="mx-auto max-w-xl">
        <div className="rounded-[32px] border border-surface-hover bg-surface/95 p-6 shadow-2xl backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-primary">تثبيت في السكة</p>
              <h1 className="mt-1 text-2xl font-heading font-black text-foreground">نزّل التطبيق على موبايلك</h1>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-gray-500">
            علشان تفتحه بسرعة من وسط التطبيقات اللي عندك، وتستخدمه كتجربة أهدى وأسهل من المتصفح كل مرة.
          </p>

          {isStandalone ? (
            <div className="mt-6 rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="mt-3 text-lg font-black text-foreground">التطبيق متثبت بالفعل</p>
              <p className="mt-1 text-sm text-gray-500">تقدر تفتحه دلوقتي من شاشة التطبيقات أو الشاشة الرئيسية.</p>
            </div>
          ) : isIOS ? (
            <div className="mt-6 rounded-3xl border border-primary/15 bg-primary/5 p-5">
              <p className="text-lg font-black text-foreground">على iPhone أو iPad</p>
              <ol className="mt-4 space-y-3 text-sm leading-7 text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">1</span>
                  <span>
                    اضغط على <b>مشاركة</b> <Share className="mx-1 inline h-4 w-4" />
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">2</span>
                  <span>
                    اختَر <b>إضافة إلى الشاشة الرئيسية</b> <PlusSquare className="mx-1 inline h-4 w-4" />
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-black text-primary">3</span>
                  <span>هيظهر لك التطبيق وسط التطبيقات عندك بشكل طبيعي.</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-primary/15 bg-primary/5 p-5">
              <p className="text-lg font-black text-foreground">على Android</p>
              <p className="mt-2 text-sm leading-7 text-gray-500">
                افتح الصفحة من Chrome أو متصفح يدعم التثبيت، واضغط الزر تحت. لو الزر مش ظاهر، افتح قائمة المتصفح واختر
                <b> تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>.
              </p>

              <button
                onClick={handleInstall}
                disabled={!isInstallReady || isInstalling || installSucceeded}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {installSucceeded
                  ? "تم تثبيت التطبيق"
                  : isInstalling
                    ? "جارٍ التثبيت..."
                    : isInstallReady
                      ? "تثبيت التطبيق"
                      : "افتح الصفحة من الهاتف أولًا"}
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-surface-hover pt-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80"
            >
              ارجع للموقع
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
