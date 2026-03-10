"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
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
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl rounded-full w-64 h-64 bg-primary pointer-events-none"></div>

           <div className="relative z-10">
              <div className="text-center mb-8">
                 <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-2xl shadow-lg shadow-primary/20 mb-4">
                   في
                 </div>
                 <h1 className="text-2xl font-black text-foreground mb-2">أهلاً بيك تاني! 👋</h1>
                 <p className="text-gray-400 text-sm">سجل دخول عشان تتابع طلباتك وتستمتع بعروضنا المستمرة.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                 <div className="space-y-2">
                   <Label htmlFor="phone">رقم الموبايل</Label>
                   <Input id="phone" type="tel" required placeholder="01xxxxxxxxx" dir="ltr" className="text-right tracking-widest" />
                 </div>
                 
                 <div className="space-y-2">
                   <div className="flex justify-between items-center">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Link href="/forgot-password" className="text-xs text-primary hover:underline font-semibold">نسيت الباسورد؟</Link>
                   </div>
                   <Input id="password" type="password" required placeholder="••••••••" dir="ltr" className="text-right" />
                 </div>

                 <Button type="submit" size="lg" className="w-full text-lg font-bold rounded-xl mt-4 h-12" isLoading={isSubmitting}>
                    دخول
                 </Button>
              </form>

              <div className="mt-8 text-center text-sm">
                 <span className="text-gray-400">معندكش حساب؟ </span>
                 <Link href="/register" className="text-primary font-bold hover:underline">سجل حساب جديد</Link>
              </div>
           </div>

        </div>

      </main>
      <Footer />
    </>
  )
}
