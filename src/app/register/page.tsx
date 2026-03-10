"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => setIsSubmitting(false), 1500)
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center py-12 px-4">
        
        <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl rounded-full w-64 h-64 bg-secondary pointer-events-none"></div>

           <div className="relative z-10">
              <div className="text-center mb-8">
                 <h1 className="text-2xl font-black text-foreground mb-2">انضم لينا دلوقتي! 🚀</h1>
                 <p className="text-gray-400 text-sm">سجل حساب جديد وابدأ تجربة تسوق أسهل وأوفر.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 
                 <div className="space-y-2">
                   <Label htmlFor="name">الاسم بالكامل</Label>
                   <Input id="name" required placeholder="مثال: أحمد محمد" />
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="phone">رقم الموبايل</Label>
                   <Input id="phone" type="tel" required placeholder="01xxxxxxxxx" dir="ltr" className="text-right tracking-widest" />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="password">كلمة المرور</Label>
                   <Input id="password" type="password" required placeholder="••••••••" dir="ltr" className="text-right" />
                   <p className="text-xs text-gray-500">لا تقل عن 8 أحرف</p>
                 </div>

                 <Button type="submit" size="lg" className="w-full text-lg font-bold rounded-xl mt-6 h-12" isLoading={isSubmitting}>
                    إنشاء حساب
                 </Button>
                 
                 <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
                    بتسجيلك، أنت توافق على <Link href="/terms" className="text-primary hover:underline">الشروط والأحكام</Link> و <Link href="/privacy" className="text-primary hover:underline">سياسة الخصوصية</Link>.
                 </p>
              </form>

              <div className="mt-8 pt-6 border-t border-surface-hover text-center text-sm">
                 <span className="text-gray-400">عندك حساب فعلاً؟ </span>
                 <Link href="/login" className="text-primary font-bold hover:underline">سجل دخول من هنا</Link>
              </div>
           </div>

        </div>

      </main>
      <Footer />
    </>
  )
}
