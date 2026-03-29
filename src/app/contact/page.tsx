"use client"

import * as React from "react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppSettings } from "@/contexts/AppSettingsContext"
import { getSupportWhatsAppEntries } from "@/services/appSettingsService"
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon"

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const { settings } = useAppSettings()
  const whatsappEntries = React.useMemo(() => getSupportWhatsAppEntries(settings), [settings])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      alert("وصلتنا رسالتك، وهنرد عليك في أقرب وقت.")
    }, 1500)
  }

  return (
    <>
      <Header />
      <main className="flex-1 min-h-screen bg-background pb-20">
        
        <div className="bg-surface border-b border-surface-hover py-12 md:py-16">
           <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">كلمنا، وإحنا معاك</h1>
              <p className="text-gray-500 max-w-2xl mx-auto">
                 عندك سؤال؟ في حاجة واقفة معاك في الطلب؟ أو حتى عندك اقتراح؟ ابعتلنا على طول، وإحنا هنسمعك ونرد عليك.
              </p>
           </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
              
              {/* Info & FAQ shortcut */}
              <div className="space-y-10">
                 <div>
                    <h3 className="text-xl font-bold text-foreground mb-6">طرق التواصل</h3>
                    
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                          </div>
                          <div>
                             <p className="font-semibold text-foreground">البريد الإلكتروني</p>
                             {settings.supportEmail ? (
                               <a href={`mailto:${settings.supportEmail}`} className="text-gray-500 mt-1 inline-flex hover:text-primary transition-colors" dir="ltr">
                                 {settings.supportEmail}
                               </a>
                             ) : (
                             <p className="text-gray-500 mt-1">أول ما نفعّل إيميل الدعم هتلاقيه ظاهر هنا.</p>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                          </div>
                          <div>
                             <p className="font-semibold text-foreground">رقم الدعم</p>
                             {settings.supportPhone ? (
                               <a href={`tel:${settings.supportPhone}`} className="text-gray-500 mt-1 inline-flex hover:text-primary transition-colors" dir="ltr">
                                 {settings.supportPhone}
                               </a>
                             ) : (
                               <p className="text-gray-500 mt-1">أول ما تضيف رقم الدعم من الإعدادات هيظهر هنا على طول.</p>
                             )}
                             <p className="text-xs text-emerald-500 mt-1">ضيف الرقم وقت ما تحب، والموقع هيتحدّث لوحده.</p>
                          </div>
                       </div>

                       <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                             <WhatsAppIcon className="w-5 h-5" />
                          </div>
                          <div className="space-y-2">
                             <p className="font-semibold text-foreground">الواتساب</p>
                             {whatsappEntries.length > 0 ? (
                               whatsappEntries.map((entry) => (
                                 <a
                                   key={entry.id}
                                   href={entry.href}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/8 px-3 py-2 text-sm font-bold text-emerald-500 transition-colors hover:bg-emerald-500/12"
                                 >
                                   <WhatsAppIcon className="w-4 h-4" />
                                   <span>كلمنا على الواتساب</span>
                                 </a>
                               ))
                             ) : (
                               <p className="text-gray-500">أول ما تضيف أرقام أو روابط الواتساب من الإعدادات هتظهر هنا فورًا.</p>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="bg-surface border border-surface-hover rounded-3xl p-6">
                    <h3 className="font-bold text-foreground mb-2">عاوز إجابة سريعة؟</h3>
                    <p className="text-sm text-gray-500 mb-4">ممكن تلاقي إجابة سؤالك جاهزة في صفحة الأسئلة الشائعة من غير ما تستنى رد.</p>
                    <Button variant="outline" className="w-full" asChild>
                       <Link href="/faq">
                          شوف الأسئلة الشائعة
                       </Link>
                    </Button>
                 </div>
              </div>

              {/* Contact Form */}
              <div className="bg-surface border border-surface-hover rounded-3xl p-8 shadow-xl">
                 <h2 className="text-2xl font-bold text-foreground mb-6">ابعتلنا رسالتك</h2>
                 <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-2">
                         <Label htmlFor="name">الاسم</Label>
                         <Input id="name" required placeholder="أحمد محمد" />
                       </div>
                       <div className="space-y-2">
                         <Label htmlFor="phone">رقم الموبايل</Label>
                         <Input id="phone" type="tel" required placeholder="01xxxxxxxxx" dir="ltr" className="text-right" />
                       </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                      <Input id="email" type="email" placeholder="example@email.com" dir="ltr" className="text-right" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message">اكتب اللي حابب تقوله</Label>
                       <textarea 
                         id="message" 
                         required 
                         rows={5} 
                         className="flex w-full rounded-xl border border-surface-hover bg-surface px-4 py-3 text-sm text-foreground transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent custom-scrollbar resize-none"
                         placeholder="اكتب مشكلتك أو سؤالك هنا براحتك..."
                       ></textarea>
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg font-bold rounded-xl mt-4 h-14" isLoading={isSubmitting}>
                       ابعت الرسالة
                    </Button>
                 </form>
              </div>

           </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
