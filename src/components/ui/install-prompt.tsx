"use client"

import * as React from "react"
import { Share, PlusSquare, X, Download } from "lucide-react"
import { Button } from "./button"

export function InstallPrompt() {
  const [isReadyForInstall, setIsReadyForInstall] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)
  const [isStandalone, setIsStandalone] = React.useState(false)
  const [showPrompt, setShowPrompt] = React.useState(false)
  const deferredPrompt = React.useRef<any>(null)

  React.useEffect(() => {
    // 1. Check if already installed (standalone mode)
    const isModeStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    setIsStandalone(isModeStandalone)

    // Check if user dismissed it before
    const hasDismissed = localStorage.getItem("pwa_prompt_dismissed") === "true"

    if (isModeStandalone) return;

    // 2. Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !hasDismissed) {
      // Show immediately on iOS if not installed & not dismissed
      setShowPrompt(true);
    }

    // 3. Android / Chrome: Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setIsReadyForInstall(true);
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      deferredPrompt.current = null;
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa_prompt_dismissed", "true")
  }

  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-full duration-500">
      <div className="mx-auto max-w-sm bg-surface shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] border border-surface-hover rounded-2xl p-5 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-foreground bg-surface-hover/50 hover:bg-surface-hover rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pt-2">
          <div className="shrink-0 rounded-2xl bg-secondary/10 p-3">
            <Download className="w-8 h-8 text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-foreground mb-1 text-lg">
              نزّل تطبيق في السكة
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              تجربة أسرع وأسهل بدل متصفح الويب.
            </p>

            {isIOS ? (
              <div className="bg-primary/5 rounded-xl p-3 text-xs leading-relaxed text-gray-600 border border-primary/10">
                في متصفح Safari، اضغط على <b>مشاركة (Share)</b> <Share className="w-4 h-4 inline-block mx-1" />
                ثم اختر <br /><b>Add to Home Screen</b> <PlusSquare className="w-4 h-4 inline-block mx-1" />
              </div>
            ) : isReadyForInstall ? (
              <Button
                size="lg"
                className="w-full rounded-xl font-bold bg-secondary hover:bg-secondary/90 text-white shadow-xl shadow-secondary/20"
                onClick={handleInstallClick}
              >
                تثبيت التطبيق دلوقتي
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
