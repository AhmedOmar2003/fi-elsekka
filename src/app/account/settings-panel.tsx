"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserProfile } from "@/services/ordersService"
import { updateAuthEmail, updateAuthPassword } from "@/services/authService"
import { generateStrongPassword, validateCustomerEmail, validateStrongPassword } from "@/lib/auth-validation"
import { Copy, RefreshCw, User } from "lucide-react"
import { toast } from "sonner"

type SettingsPanelProps = {
  userId: string
  currentEmail: string
  initialFullName: string
  initialPhone: string
}

export function SettingsPanel({ userId, currentEmail, initialFullName, initialPhone }: SettingsPanelProps) {
  const [fullName, setFullName] = React.useState(initialFullName)
  const [phone, setPhone] = React.useState(initialPhone)
  const [emailInput, setEmailInput] = React.useState(currentEmail)
  const [passwordInput, setPasswordInput] = React.useState("")
  const [suggestedPassword, setSuggestedPassword] = React.useState(() => generateStrongPassword())
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveMsg, setSaveMsg] = React.useState("")

  React.useEffect(() => {
    setFullName(initialFullName)
    setPhone(initialPhone)
  }, [initialFullName, initialPhone])

  React.useEffect(() => {
    setEmailInput(currentEmail)
  }, [currentEmail])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    setSaveMsg("")

    let hasError = false
    let exactErrorStr = ""

    const { error: profileError } = await updateUserProfile(userId, { full_name: fullName, phone })
    if (profileError) {
      hasError = true
      exactErrorStr += `Profile Error: ${profileError.message} | `
    }

    if (emailInput && emailInput !== currentEmail) {
      const emailValidationError = validateCustomerEmail(emailInput)
      if (emailValidationError) {
        hasError = true
        exactErrorStr += `Email Error: ${emailValidationError} | `
      } else {
        const { error: emailError } = await updateAuthEmail(emailInput)
        if (emailError) {
          hasError = true
          exactErrorStr += `Email Error: ${emailError.message} | `
        }
      }
    }

    if (passwordInput) {
      const passwordValidationError = validateStrongPassword(passwordInput)
      if (passwordValidationError) {
        hasError = true
        exactErrorStr += `Password Error: ${passwordValidationError} | `
      } else {
        const { error: passError } = await updateAuthPassword(passwordInput)
        if (passError) {
          hasError = true
          exactErrorStr += `Password Error: ${passError.message} | `
        } else {
          setPasswordInput("")
        }
      }
    }

    setIsSaving(false)
    setSaveMsg(hasError ? exactErrorStr : "تمام، عدلنا بياناتك بنجاح ✨")
  }

  const applySuggestedPassword = () => {
    setPasswordInput(suggestedPassword)
  }

  const copySuggestedPassword = async () => {
    try {
      await navigator.clipboard.writeText(suggestedPassword)
      toast.success("انسخنا الكلمة", { description: "احفظها في مكان آمن علشان تقدر ترجع لها بعدين" })
    } catch {
      toast.error("مقدرناش ننسخها", { description: "انسخها يدويًا لو تحب" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-surface-hover rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2 pb-4 border-b border-surface-hover">
          <User className="w-5 h-5 text-primary" />
          بياناتك الشخصية
        </h2>
        <div className="space-y-2 md:col-span-2">
          <Label>الاسم بالكامل</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اسمك هنا" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>رقم الموبايل</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="01xxxxxxxxx" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2 md:col-span-2 border-t border-surface-hover pt-4 mt-2">
          <Label>الإيميل بتاع الدخول</Label>
          <Input value={emailInput} onChange={(e) => setEmailInput(e.target.value)} type="email" dir="ltr" className="text-right" />
          <p className="text-[11px] text-gray-500">لو غيرته، غالبًا هيوصلك إيميل تأكيد.</p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>كلمة المرور الجديدة</Label>
          <Input value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} type="password" placeholder="سيبه فاضي لو مش عاوز تغيّره" dir="ltr" className="text-right" />
          <div className="rounded-2xl border border-surface-hover bg-surface p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">كلمة مرور قوية جاهزة</p>
                <p className="text-xs text-gray-500">يفضل تحفظها في مكان آمن قبل ما تغيّر الباسورد</p>
              </div>
              <button
                type="button"
                onClick={() => setSuggestedPassword(generateStrongPassword())}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-hover text-gray-500 transition-colors hover:text-foreground"
                aria-label="اقتراح كلمة مرور جديدة"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 rounded-xl bg-background/70 px-3 py-2 text-start font-mono text-sm tracking-[0.18em] text-foreground" dir="ltr">
              {suggestedPassword}
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={applySuggestedPassword}>
                استخدمها
              </Button>
              <Button type="button" variant="ghost" className="rounded-xl px-3" onClick={copySuggestedPassword} aria-label="نسخ كلمة المرور المقترحة">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {saveMsg && (
        <p className={`text-center text-sm font-bold ${saveMsg.includes("خطأ") ? "text-rose-500" : "text-emerald-500"}`}>{saveMsg}</p>
      )}

      <Button onClick={handleSaveSettings} className="rounded-xl px-10 h-12 font-bold shadow-primary/20 shadow-lg" disabled={isSaving}>
        {isSaving ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            بنحفظ...
          </div>
        ) : "احفظ التعديلات"}
      </Button>
    </div>
  )
}
