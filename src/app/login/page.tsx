"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "@/services/authService"
import { supabase } from "@/lib/supabase"
import { LogIn, AlertCircle, Mail } from "lucide-react"

export default function LoginPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh] flex items-center justify-center p-4">
        <React.Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>}>
          <LoginContent />
        </React.Suspense>
      </main>
      <Footer />
    </>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParams = searchParams.get('redirect')

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isEmailUnconfirmed, setIsEmailUnconfirmed] = React.useState(false)
  const [resentEmail, setResentEmail] = React.useState(false)
  const [resending, setResending] = React.useState(false)

  // Map Supabase English errors to friendly Arabic messages
  const translateError = (msg: string) => {
    if (msg.includes("Email not confirmed")) return "البريد الإلكتروني لم يتم تأكيده بعد. تحقق من بريدك الوارد."
    if (msg.includes("Invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غلط، حاول مرة أخرى."
    if (msg.includes("User already registered")) return "البريد الإلكتروني ده مسجل قبل كده، سجل دخول بدلاً من ذلك."
    if (msg.includes("Too many requests") || msg.includes("rate limit") || msg.includes("email rate")) return "تجاوزت الحد المسموح من رسائل الإيميل، حاول بعد ساعة. (أو عطل تأكيد الإيميل من لوحة Supabase)"
    if (msg.includes("Password should be at least")) return "كلمة المرور لازم تكون 6 أحرف على الأقل."
    return msg
  }

  const handleResendConfirmation = async () => {
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResending(false)
    if (!error) setResentEmail(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    const { error } = await signIn(email, password)

    if (error) {
      setIsLoading(false)
      const isUnconfirmed = error.message.includes("Email not confirmed")
      setIsEmailUnconfirmed(isUnconfirmed)
      setErrorMsg(translateError(error.message))
      return
    }

    router.push(redirectParams || "/account")
  }

  return (
    <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium">
      <h1 className="text-3xl font-black text-foreground mb-2 text-center">أهلاً بيك تاني! 👋</h1>
      <p className="text-gray-500 text-center mb-8">سجل دخول عشان تتابع طلباتك وتشوف مشترياتك</p>

      {errorMsg && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
          {isEmailUnconfirmed && (
            resentEmail ? (
              <p className="text-emerald-500 text-xs font-bold flex items-center gap-1.5"><Mail className="w-4 h-4" /> تم إرسال إيميل التأكيد، افتح بريدك!</p>
            ) : (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="self-start text-xs font-bold text-primary hover:underline disabled:opacity-50 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                {resending ? "جاري الإرسال..." : "إعادة إرسال إيميل التأكيد"}
              </button>
            )
          )}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground px-1">البريد الإلكتروني</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@mail.com"
            className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between px-1">
            <label className="text-sm font-bold text-foreground">كلمة المرور</label>
            <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline">نسيت كلمة المرور؟</Link>
          </div>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr"
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full h-12 rounded-xl font-bold text-lg shadow-primary/20 shadow-lg mt-4 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              تسجيل الدخول
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-gray-500 text-sm">
        معندكش حساب؟ {" "}
        <Link href={`/register${redirectParams ? `?redirect=${redirectParams}` : ''}`} className="text-primary font-bold hover:underline">
          أنشئ حساب جديد
        </Link>
      </div>
    </div>
  )
}
