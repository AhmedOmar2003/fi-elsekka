"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { Banknote } from "lucide-react"
import { useProducts } from "@/contexts/ProductsContext"

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
  const { categories } = useProducts()

  const footerCategoryNames = React.useMemo(
    () => ["ملابس وأزياء", "سوبر ماركت", "صيدلية", "أدوات منزلية"],
    []
  )

  const footerCategories = footerCategoryNames
    .map((name) => categories.find((category) => category.name === name))
    .filter((category): category is (typeof categories)[number] => !!category)

  return (
    <footer className="mt-auto w-full px-2 pb-20 pt-16 md:px-4 md:pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="material-card-elevated grid grid-cols-1 gap-12 rounded-3xl p-8 md:grid-cols-4 lg:gap-16 lg:p-12 relative overflow-hidden">
          
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
                <span className="font-black text-2xl text-foreground">فِي&nbsp;</span>
                <span className="font-black text-2xl text-primary">السِّكَّةِ</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              صاحبك الجدع في الطلبات. كل اللي محتاجه، من البيت لحد باب البيت، وبأسهل طريقة وأروق تجربة.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="material-chip text-xs font-bold text-primary">توصيل أسرع</span>
              <span className="material-chip text-xs font-bold text-foreground">دفع عند الاستلام</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-base font-black text-foreground">الأقسام</h4>
            <ul className="font-heading space-y-2 text-sm text-gray-500">
              {footerCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.id}`} className="inline-flex rounded-full px-2 py-1 hover:bg-surface-container hover:text-primary transition-colors">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-base font-black text-foreground">خلينا في ظهرك</h4>
            <ul className="font-heading space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="inline-flex rounded-full px-2 py-1 hover:bg-surface-container hover:text-primary transition-colors">احنا مين</Link></li>
              <li><Link href="/faq" className="inline-flex rounded-full px-2 py-1 hover:bg-surface-container hover:text-primary transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/account" className="inline-flex rounded-full px-2 py-1 hover:bg-surface-container hover:text-primary transition-colors">حسابي</Link></li>
              <li><Link href="/orders" className="inline-flex rounded-full px-2 py-1 hover:bg-surface-container hover:text-primary transition-colors">طلباتي</Link></li>
              <li><Link href="/contact" className="inline-flex rounded-full px-2 py-1 hover:bg-surface-container hover:text-primary transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1">
             <h4 className="mb-4 text-base font-black text-foreground">الدفع عند الاستلام</h4>
             <div className="rounded-[28px] border border-surface-border bg-surface-container p-4 shadow-[var(--shadow-material-1)]">
               <div className="flex items-center gap-3">
               <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                 <Banknote className="h-6 w-6" />
               </div>
               <div>
                  <p className="font-heading text-sm font-bold text-foreground">ادفع وإنت مطمن</p>
                  <p className="text-xs text-gray-500">كل طلباتنا بتدفعها كاش وقت الاستلام</p>
               </div>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center justify-between border-t material-divider pt-6 pb-4 text-center sm:flex-row text-xs text-gray-500">
          <p>© {new Date().getFullYear()} في السكة. كل الحقوق محفوظة.</p>
          <div className="mt-4 flex gap-4 sm:mt-0">
             <Link href="/terms" className="hover:text-foreground transition-colors">الشروط والأحكام</Link>
             <Link href="/privacy" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

