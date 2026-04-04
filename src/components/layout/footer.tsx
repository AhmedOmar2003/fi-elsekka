"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Banknote } from "lucide-react"
import { useAppSettings } from "@/contexts/AppSettingsContext"
import { getSupportWhatsAppEntries } from "@/services/appSettingsService"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"
import { fetchCategories, type Category } from "@/services/categoriesService"

// Same motorcycle icon as the header
function MotorcycleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="9"  cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="9"  cy="24" r="2" />
      <circle cx="39" cy="24" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="39" cy="24" r="2" />
      <path d="M9 24 L14 14 L22 14 L28 10 L36 14 L39 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M17 14 L24 8 L31 8 L36 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M38 10 L42 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="9" r="2.5" />
    </svg>
  )
}

export function Footer() {
  const { settings } = useAppSettings()
  const [categories, setCategories] = React.useState<Category[]>([])

  React.useEffect(() => {
    let mounted = true

    void fetchCategories()
      .then((data) => {
        if (mounted) {
          setCategories(data)
        }
      })
      .catch(() => {
        if (mounted) {
          setCategories([])
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const footerCategoryNames = React.useMemo(
    () => ["ملابس وأزياء", "سوبر ماركت", "طعام", "صيدلية", "أدوات منزلية"],
    []
  )

  const footerCategories = footerCategoryNames
    .map((name) => categories.find((category) => category.name === name))
    .filter((category): category is (typeof categories)[number] => !!category)
  const whatsappEntries = getSupportWhatsAppEntries(settings)
  const siteTagline = settings.siteTagline || "طلباتك ماشية معاك من غير لف."

  return (
    <footer className="mt-auto w-full px-2 pb-20 pt-16 md:px-4 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative grid grid-cols-1 gap-12 overflow-hidden rounded-[36px] border border-white/8 bg-[#101816] p-8 text-white shadow-[var(--shadow-material-2)] md:grid-cols-4 lg:gap-16 lg:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
          <div className="pointer-events-none absolute -top-24 start-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 end-8 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
          
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2 group">
              <Image
                src="/icon-192x192.svg"
                alt="في السكة Logo" 
                width={40}
                height={40}
                className="rounded-2xl shadow-[var(--shadow-material-2)] group-hover:shadow-[var(--shadow-material-3)] transition-shadow" 
              />
              <div className="flex items-baseline gap-0 leading-none" style={{ fontFamily: 'var(--font-lalezar), serif' }}>
                <span className="font-black text-2xl text-white">فِي&nbsp;</span>
                <span className="font-black text-2xl text-primary">السِّكَّةِ</span>
              </div>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-white/74">
              {siteTagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">توصيل سريع</span>
              <span className="inline-flex items-center rounded-full border border-white/8 bg-white/6 px-3 py-1.5 text-xs font-bold text-white/82">ادفع وقت الاستلام</span>
            </div>
            {(settings.supportEmail || settings.supportPhone || whatsappEntries.length > 0) && (
              <div className="mt-5 space-y-2 text-sm text-white/78">
                {settings.supportPhone && (
                  <a href={`tel:${settings.supportPhone}`} className="flex items-center gap-2 transition-colors hover:text-white">
                    <span className="font-bold">رقم الدعم:</span>
                    <span dir="ltr">{settings.supportPhone}</span>
                  </a>
                )}
                {settings.supportEmail && (
                  <a href={`mailto:${settings.supportEmail}`} className="flex items-center gap-2 transition-colors hover:text-white">
                    <span className="font-bold">إيميل الدعم:</span>
                    <span dir="ltr">{settings.supportEmail}</span>
                  </a>
                )}
                {whatsappEntries.map((entry) => (
                  <a
                    key={entry.id}
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-200 transition-colors hover:bg-emerald-500/15 hover:text-white"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    <span className="font-bold">{entry.label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 text-base font-black text-white">الأقسام</h2>
            <ul className="font-heading space-y-2 text-sm text-white/78">
              {footerCategories.map((category) => (
                <li key={category.id}>
                    <Link href={`/category/${category.id}`} className="inline-flex rounded-full px-2 py-1 font-bold transition-colors hover:bg-white/6 hover:text-white">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-base font-black text-white">خليك مطمن</h2>
            <ul className="font-heading space-y-2 text-sm text-white/78">
              <li><Link href="/about" className="inline-flex rounded-full px-2 py-1 font-bold hover:bg-white/6 hover:text-white transition-colors">احنا مين</Link></li>
              <li><Link href="/faq" className="inline-flex rounded-full px-2 py-1 font-bold hover:bg-white/6 hover:text-white transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/account" className="inline-flex rounded-full px-2 py-1 font-bold hover:bg-white/6 hover:text-white transition-colors">حسابي</Link></li>
              <li><Link href="/orders" className="inline-flex rounded-full px-2 py-1 font-bold hover:bg-white/6 hover:text-white transition-colors">طلباتي</Link></li>
              <li><Link href="/contact" className="inline-flex rounded-full px-2 py-1 font-bold hover:bg-white/6 hover:text-white transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1">
             <h2 className="mb-4 text-base font-black text-white">ادفع وقت الاستلام</h2>
             <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-4 shadow-[var(--shadow-material-2)] backdrop-blur-sm">
               <div className="flex items-center gap-3">
               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                 <Banknote className="h-6 w-6" />
               </div>
               <div>
                  <p className="font-heading text-sm font-bold text-white">ادفع وإنت مطمن</p>
                  <p className="text-xs text-white/58">كل طلباتنا بتدفعها كاش وقت ما تستلم</p>
               </div>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between border-t border-white/8 pb-4 pt-6 text-center text-xs text-white/52 sm:flex-row">
          <p>© {new Date().getFullYear()} في السكة. كل الحقوق محفوظة.</p>
          <div className="mt-4 flex gap-4 sm:mt-0">
             <Link href="/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link>
             <Link href="/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

