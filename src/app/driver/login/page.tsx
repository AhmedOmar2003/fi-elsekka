"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { signIn, signOut } from "@/services/authService"
import { Bike, LogIn, AlertCircle, CheckCircle2 } from "lucide-react"

export default function DriverLoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <React.Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>}>
        <DriverLoginContent />
      </React.Suspense>
    </main>
  )
}

function DriverLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = React.useState(searchParams.get("email") || "")
  const [password, setPassword] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState("")
  const [successMsg, setSuccessMsg] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (searchParams.get("blocked") === "1") {
      setSuccessMsg("")
      setErrorMsg("الحساب ده خاص بصفحة المندوبين بس. ادخل من هنا وهتفتحلك لوحة المندوب على طول.")
      return
    }

    if (searchParams.get("logged_out") === "1") {
      setErrorMsg("")
      setSuccessMsg("مستنيينك تيجي توصل طلبات تاني يا بطل 🛵")
    }
  }, [searchParams])

  const translateError = (msg: string) => {
    if (msg.includes("Invalid login credentials")) return "الإيميل أو الباسورد مش مظبوطين، جرّب تاني."
    if (msg.includes("Email not confirmed")) return "البريد لسه محتاج تأكيد من الإيميل."
    return "مش عارفين ندخلك دلوقتي، جرّب تاني كمان شوية."
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg("")
    setSuccessMsg("")

    const { data, error } = await signIn(email, password)

    if (error) {
      setIsLoading(false)
      setErrorMsg(translateError(error.message))
      return
    }

    const userRole = data?.user?.user_metadata?.role
    if (userRole !== "driver") {
      await signOut()
      setIsLoading(false)
      setErrorMsg("الصفحة دي مخصوص للمندوبين. لو إنت عميل، ادخل من صفحة تسجيل الدخول العادية.")
      return
    }

    router.push("/driver")
  }

  return (
    <div className="w-full max-w-md bg-surface border border-surface-hover rounded-3xl p-6 sm:p-10 shadow-premium">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
        <Bike className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-black text-center text-foreground mb-2">أهلاً يا بطل التوصيل 🛵</h1>
      <p className="text-gray-500 text-center mb-8">
        سجل دخولك من هنا علشان تشوف الطلبات اللي عليك وتتحرك بسرعة.
      </p>

      {errorMsg && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground px-1">الإيميل بتاعك</label>
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="driver@mail.com"
            className="h-12 rounded-xl bg-background border-surface-hover focus-visible:border-primary text-start direction-ltr"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-foreground px-1">الباسورد</label>
          <PasswordInput
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
              ادخل على لوحة المندوب
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-gray-500 text-sm">
        لو إنت عميل عادي،{" "}
        <Link href="/login" className="text-primary font-bold hover:underline">
          ارجع لصفحة الدخول العادية
        </Link>
      </div>
    </div>
  )
}
