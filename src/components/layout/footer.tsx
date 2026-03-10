import * as React from "react"
import Link from "next/link"
import { Banknote } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-surface-hover bg-background pt-10 pb-20 md:pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 pl-4">
          
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold shadow-md shadow-primary/20">
                في
              </div>
              <span className="font-heading text-xl font-black tracking-tight text-foreground">
                في السكة
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              صاحبك الجدع في التسوق. كل اللي تحتاجه، من البيت لحد البيت بأسهل طريقة وبأحسن سعر.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">الأقسام</h4>
            <ul className="font-heading space-y-2 text-sm text-gray-400">
              <li><Link href="/category/groceries" className="hover:text-primary transition-colors">سوبر ماركت</Link></li>
              <li><Link href="/category/electronics" className="hover:text-primary transition-colors">إلكترونيات</Link></li>
              <li><Link href="/category/pharmacy" className="hover:text-primary transition-colors">صيدلية</Link></li>
              <li><Link href="/category/fashion" className="hover:text-primary transition-colors">ملابس الموضة</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">خلينا نساعدك</h4>
            <ul className="font-heading space-y-2 text-sm text-gray-400">
              <li><Link href="/account" className="hover:text-primary transition-colors">حسابي</Link></li>
              <li><Link href="/orders" className="hover:text-primary transition-colors">طلباتي</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">الأسئلة الشائعة</Link></li>
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
                  <p className="text-xs text-gray-400">كل طلباتنا الدفع فيها كاش لما تستلم</p>
               </div>
             </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-surface-hover pt-8 pb-4 text-center sm:flex-row text-xs text-gray-500">
          <p>حقوق النشر &copy; {new Date().getFullYear()} في السكة. كل الحقوق محفوظة.</p>
          <div className="mt-4 flex gap-4 sm:mt-0">
             <Link href="/terms" className="hover:text-gray-300">الشروط والأحكام</Link>
             <Link href="/privacy" className="hover:text-gray-300">سياسة الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
