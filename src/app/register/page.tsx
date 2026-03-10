"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signUp } from "@/services/authService"
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react"

export default function RegisterPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh] flex items-center justify-center p-4">
        <React.Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>}>
          <RegisterContent />
        </React.Suspense>
      </main>
      <Footer />
    </>
  )
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParams = searchParams.get('redirect')

  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const [errorMsg, setErrorMsg] = React.useState("")
  const [success, setSuccess] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")

    const translateError = (msg: string) => {
      if (msg.includes("User already registered") || msg.includes("already registered")) return "البريد الإلكتروني ده عنده حساب بالفعل، جرب تسجيل الدخول."
      if (msg.includes("Too many requests") || msg.includes("rate limit") || msg.includes("email rate")) return "تجاوزت حد رسائل التأكيد للساعة. حاول تاني بعد ساعة، أو عطل تأكيد الإيميل من Supabase Dashboard."
      if (msg.includes("Password should be at least")) return "كلمة المرور لازم تكون 6 أحرف على الأقل."
      return msg
    }

    const { error } = await signUp(email, password, fullName)

    if (error) {
      setIsLoading(false)
      setErrorMsg(translateError(error.message))
      return
    }

    setSuccess(true)
    setIsLoading(false)

    // Automatically navigate after short delay as auto-login on signup is often true depending on Supabase settings
    setTimeout(() => {
      router.push(redirectParams || "/account")
    }, 2000)
  }

  return (
    <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium">
      <h1 className="text-3xl font-black text-foreground mb-2 text-center">أهلاً بيك في السكة! ✨</h1>
      <p className="text-gray-400 text-center mb-8">إنشئ حساب جديد عشان تبدأ رحلة التسوق بتاعتك</p>

      {errorMsg && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground">تم إنشاء الحساب بنجاح!</h2>
          <p className="text-gray-400 text-sm">جاري تحويلك للصفحة الرئيسية...</p>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-5">

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300 px-1">الاسم بالكامل</label>
            <Input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="أحمد محمد"
              className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300 px-1">البريد الإلكتروني</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr px-4"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-300 px-1">كلمة المرور</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr px-4"
              required
              minLength={6}
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
                <UserPlus className="w-5 h-5" />
                إنشاء حساب
              </>
            )}
          </Button>
        </form>
      )}

      {!success && (
        <div className="mt-8 text-center text-gray-400 text-sm">
          عندك حساب بالفعل؟ {" "}
          <Link href={`/login${redirectParams ? `?redirect=${redirectParams}` : ''}`} className="text-primary font-bold hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      )}
    </div>
  )
}
