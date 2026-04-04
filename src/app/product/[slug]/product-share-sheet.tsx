"use client"

import * as React from "react"
import { Copy, Share2, X } from "lucide-react"

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.57 2 2.13 6.43 2.13 11.9c0 1.75.46 3.46 1.33 4.96L2 22l5.3-1.39a9.9 9.9 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.12-2.89-6.97Zm-7.02 15.2h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.15.83.84-3.07-.2-.31a8.16 8.16 0 0 1-1.27-4.37c0-4.53 3.69-8.22 8.24-8.22 2.2 0 4.27.86 5.82 2.41a8.15 8.15 0 0 1 2.4 5.82c0 4.54-3.69 8.23-8.2 8.23Zm4.5-6.13c-.24-.12-1.4-.69-1.62-.76-.21-.08-.37-.12-.53.12-.15.23-.61.76-.74.92-.14.16-.28.18-.52.06a6.65 6.65 0 0 1-1.95-1.2 7.4 7.4 0 0 1-1.36-1.69c-.14-.24-.01-.36.1-.48.11-.11.24-.28.35-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.28-.72-1.75-.19-.46-.39-.4-.53-.4h-.45c-.16 0-.42.06-.65.3-.22.24-.84.82-.84 2 0 1.17.86 2.3.98 2.46.12.16 1.68 2.57 4.08 3.6.57.24 1.02.38 1.37.49.57.18 1.1.15 1.52.09.46-.07 1.4-.57 1.6-1.12.2-.56.2-1.03.14-1.13-.05-.1-.2-.16-.44-.28Z" />
    </svg>
  )
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.09 4.39 23.08 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.08 24 18.09 24 12.07Z" />
    </svg>
  )
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H22l-6.76 7.73L23.2 22h-6.24l-4.9-6.4L6.46 22H3.35l7.23-8.26L1 2h6.4l4.43 5.84L18.9 2Zm-1.1 18h1.72L6.45 3.9H4.61L17.8 20Z" />
    </svg>
  )
}

function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.94 4.66c.17-.8-.4-1.38-1.16-1.09L2.6 10.55c-.74.3-.73 1.34.02 1.62l4.62 1.45 1.79 5.64c.23.72 1.15.84 1.54.2l2.55-4.11 4.95 3.67c.6.44 1.45.11 1.6-.62l2.27-13.74ZM9.4 13.11l9.77-6.18-7.93 7.68a.8.8 0 0 0-.21.37l-.9 3.6-.73-2.3a.8.8 0 0 0-.52-.52l-2.3-.72 3.6-.93c.08-.02.16-.06.22-.12Z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.7 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
    </svg>
  )
}

function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.52 2c.28 1.95 1.38 3.4 3.38 4.1.6.21 1.26.32 1.98.34v2.87a8.37 8.37 0 0 1-4.1-1.1v6.13c0 3.5-2.56 6.18-6.08 6.18A6.1 6.1 0 0 1 3.6 14.4c0-3.37 2.74-6.12 6.12-6.12.33 0 .67.03 1 .08v2.96a3.13 3.13 0 0 0-1-.17 3.2 3.2 0 0 0 0 6.4 3.2 3.2 0 0 0 3.2-3.2V2h1.6Z" />
    </svg>
  )
}

type ProductShareSheetProps = {
  isOpen: boolean
  onClose: () => void
  productTitle: string
  onNativeShare: () => void
  onCopyLink: () => void
  onOpenUrl: (targetUrl: string) => void
  shareUrl: string
  shareTitle: string
  shareMessage: string
}

export function ProductShareSheet({
  isOpen,
  onClose,
  productTitle,
  onNativeShare,
  onCopyLink,
  onOpenUrl,
  shareUrl,
  shareTitle,
  shareMessage,
}: ProductShareSheetProps) {
  if (!isOpen) return null

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(`${shareMessage}\n${shareUrl}`)
  const encodedTitle = encodeURIComponent(shareTitle)

  const shareTargets = [
    {
      label: "واتساب",
      icon: WhatsAppIcon,
      iconClassName: "text-[#25D366]",
      helper: "شاركها على واتساب",
      action: () => onOpenUrl(`https://wa.me/?text=${encodedText}`),
    },
    {
      label: "فيسبوك",
      icon: FacebookIcon,
      iconClassName: "text-[#1877F2]",
      helper: "انشرها على فيسبوك",
      action: () => onOpenUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      label: "X / تويتر",
      icon: XIcon,
      iconClassName: "text-white",
      helper: "شاركها على X",
      action: () => onOpenUrl(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`),
    },
    {
      label: "تيليجرام",
      icon: TelegramIcon,
      iconClassName: "text-[#229ED9]",
      helper: "ابعتها على تيليجرام",
      action: () => onOpenUrl(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`),
    },
    {
      label: "إنستجرام",
      icon: InstagramIcon,
      iconClassName: "text-[#E4405F]",
      helper: "هننسخ الرابط وانت شاركه هناك",
      action: onCopyLink,
    },
    {
      label: "تيك توك",
      icon: TikTokIcon,
      iconClassName: "text-white",
      helper: "هننسخ الرابط وانت شاركه هناك",
      action: onCopyLink,
    },
  ] as const

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 px-4 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-[2rem] border border-surface-hover bg-[#0b1016] p-5 shadow-2xl md:rounded-[2rem] md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-sm font-bold text-primary">شارك المنتج وخلي ناس أكتر تشوفه ✨</p>
            <h2 className="text-xl font-black leading-snug text-white">لو المنتج عاجبك ابعته لحد ممكن يستفيد بيه</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-surface-hover text-gray-400 transition-colors hover:bg-surface hover:text-white"
            aria-label="إغلاق نافذة المشاركة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="line-clamp-2 font-bold text-white">{productTitle}</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onNativeShare}
            className="col-span-2 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-white transition-colors hover:bg-primary-hover"
          >
            <Share2 className="h-5 w-5" />
            مشاركة سريعة
          </button>

          {shareTargets.map((target) => (
            <button
              key={target.label}
              type="button"
              onClick={target.action}
              className="rounded-2xl border border-surface-hover bg-surface px-4 py-3 text-start transition-colors hover:bg-surface-hover"
              aria-label={`مشاركة المنتج عبر ${target.label}`}
            >
              <div className="mb-1 flex items-center gap-2 font-bold text-white">
                <target.icon className={`h-5 w-5 shrink-0 ${target.iconClassName}`} />
                <span>{target.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-400">{target.helper}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-hover bg-surface text-sm font-bold text-white transition-colors hover:bg-surface-hover"
          >
            <Copy className="h-4 w-4" />
            نسخ الرابط
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-surface-hover bg-transparent text-sm font-bold text-gray-300 transition-colors hover:bg-surface hover:text-white"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  )
}
