import * as React from "react"
import Link from "next/link"
import { Banknote } from "lucide-react"

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
  return (
    <footer className="mt-auto w-full border-t border-surface-hover bg-background pt-10 pb-20 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 pl-4">
          
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <MotorcycleIcon className="w-6 h-6" />
              </div>
              <div className="flex items-baseline gap-0 leading-none" style={{ fontFamily: 'var(--font-lalezar), serif' }}>
                <span className="font-black text-2xl text-foreground drop-shadow-sm">فِي&nbsp;</span>
                <span className="font-black text-2xl text-primary drop-shadow-sm">السِّكَّةِ</span>
              </div>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              صاحبك الجدع في التسوق. كل اللي تحتاجه، من البيت لحد البيت بأسهل طريقة وبأحسن سعر.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">الأقسام</h4>
            <ul className="font-heading space-y-2 text-sm text-gray-500">
              <li><Link href="/category/groceries" className="hover:text-primary transition-colors">سوبر ماركت</Link></li>
              <li><Link href="/category/electronics" className="hover:text-primary transition-colors">إلكترونيات</Link></li>
              <li><Link href="/category/pharmacy" className="hover:text-primary transition-colors">صيدلية</Link></li>
              <li><Link href="/category/fashion" className="hover:text-primary transition-colors">ملابس الموضة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">خلينا نساعدك</h4>
            <ul className="font-heading space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-primary transition-colors">اعرف عنا</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">الأسئلة الشائعة</Link></li>
              <li><Link href="/account" className="hover:text-primary transition-colors">حسابي</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">طلباتي</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">تواصل معنا</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
             <h4 className="mb-4 font-semibold text-foreground">الدفع عند الاستلام</h4>
             <div className="flex items-center gap-3 rounded-xl bg-surface p-3 border border-surface-hover">
               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                 <Banknote className="h-6 w-6" />
               </div>
               <div>
                  <p className="font-heading text-sm font-semibold text-foreground">ادفع وانت مطمن</p>
                  <p className="text-xs text-gray-500">كل طلباتنا الدفع فيها كاش لما تستلم</p>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-surface-hover pt-8 pb-4 text-center sm:flex-row text-xs text-gray-500">
          <p>حقوق النشر &copy; {new Date().getFullYear()} في السكة. كل الحقوق محفوظة.</p>
          <div className="mt-4 flex gap-4 sm:mt-0">
             <Link href="/terms" className="hover:text-foreground transition-colors">الشروط والأحكام</Link>
             <Link href="/privacy" className="hover:text-foreground transition-colors">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
