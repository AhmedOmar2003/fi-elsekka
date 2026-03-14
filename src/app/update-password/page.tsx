"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateAuthPassword } from "@/services/authService"
import { KeyRound, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function UpdatePasswordPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-24 md:pb-12 bg-background min-h-[80vh] flex items-center justify-center p-4">
        <UpdatePasswordContent />
      </main>
      <Footer />
    </>
  )
}

function UpdatePasswordContent() {
  const router = useRouter()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [status, setStatus] = React.useState<'checking' | 'idle' | 'loading' | 'success' | 'invalid'>('checking')
  const [errorMsg, setErrorMsg] = React.useState("")

  React.useEffect(() => {
    let resolved = false

    // Listen for Supabase PASSWORD_RECOVERY event — this fires when the user
    // clicks the link in their email. It's the most reliable way to detect that
    // it's safe to show the "set new password" form.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        resolved = true
        setStatus('idle')
        return
      }

      // If user already has a session (e.g., they refreshed after recovery), allow them in
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session && !resolved) {
        resolved = true
        setStatus('idle')
        return
      }
    })

    // Fallback: if no event fires within 3 seconds, check for existing session
    const timeout = setTimeout(async () => {
      if (!resolved) {
        const { data: { session } } = await supabase.auth.getSession()
        resolved = true
        setStatus(session ? 'idle' : 'invalid')
      }
    }, 2500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPassword) return

    if (password !== confirmPassword) {
      setErrorMsg("كلمتي المرور غير متطابقتين، تأكد من كتابتهم بشكل صحيح.")
      return
    }

    if (password.length < 6) {
      setErrorMsg("كلمة المرور يجب أن تتكون من 6 أحرف على الأقل.")
      return
    }

    setStatus('loading')
    setErrorMsg("")

    const { error } = await updateAuthPassword(password)

    if (error) {
      setStatus('idle')
      setErrorMsg(error.message)
      return
    }

    setStatus('success')
    toast.success("تم تحديث كلمة المرور!", { description: "دلوقتي تقدر تستخدم حسابك بأمان." })
    
    setTimeout(() => {
      router.push("/account")
    }, 2000)
  }

  if (status === 'checking') {
    return (
      <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-10 shadow-premium flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold">بنتأكد من الرابط...</p>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium text-center">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-3">رابط غير صالح أو منتهي! ⚠️</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          الرابط اللي دخلت عليه مش شغال أو عدى عليه وقت طويل. جرب تطلب رابط استعادة جديد من صفحة "نسيت الباسورد".
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/forgot-password" className="w-full h-12 rounded-xl font-bold bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
            اطلب رابط جديد
          </Link>
          <Link href="/" className="flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-foreground">
            الرجوع للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium text-center animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-3">تم تغيير الباسورد! ✅</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          تم تحديث كلمة المرور الخاصة بك بنجاح. جاري تحويلك لحسابك...
        </p>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium">
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
        <KeyRound className="w-6 h-6 text-primary" />
      </div>
      <h1 className="text-3xl font-black text-foreground mb-2">كلمة مرور جديدة 🔒</h1>
      <p className="text-gray-500 mb-8 text-sm sm:text-base leading-relaxed">
        اكتب كلمة المرور الجديدة بتاعتك تحت وتأكد إنك تفتكرها المرة دي!
      </p>

      {errorMsg && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground px-1">كلمة المرور الجديدة</label>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr"
            required
            disabled={status === 'loading'}
            minLength={6}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground px-1">تأكيد كلمة المرور الجديدة</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr"
            required
            disabled={status === 'loading'}
            minLength={6}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={status === 'loading'}
          className="w-full h-12 rounded-xl font-bold md:text-lg shadow-primary/20 shadow-lg mt-4 flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            "تحديث الحساب"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-foreground font-bold transition-colors">
          <ArrowRight className="w-4 h-4" />
          الرجوع لصفحة الدخول
        </Link>
      </div>
    </div>
  )
}
