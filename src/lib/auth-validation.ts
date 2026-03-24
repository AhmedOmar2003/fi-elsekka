export function normalizeAuthEmail(email: string) {
  return String(email || "").trim().toLowerCase()
}

export function isAllowedCustomerEmail(email: string) {
  return normalizeAuthEmail(email).endsWith("@gmail.com")
}

export function validateCustomerEmail(email: string) {
  const normalizedEmail = normalizeAuthEmail(email)

  if (!normalizedEmail) return "اكتب البريد الإلكتروني الأول"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return "البريد الإلكتروني مش مكتوب بشكل صحيح"
  if (!isAllowedCustomerEmail(normalizedEmail)) return "حاليًا الحسابات العادية لازم تكون على Gmail فقط"

  return null
}

export function validateStrongPassword(password: string) {
  const value = String(password || "")

  if (!value) return "اكتب كلمة المرور الأول"
  if (value.length < 8) return "كلمة المرور لازم تكون 8 حروف أو أكثر"
  if (!/\p{L}/u.test(value)) return "كلمة المرور لازم يكون فيها حرف واحد على الأقل"
  if (!/\p{N}/u.test(value)) return "كلمة المرور لازم يكون فيها رقم واحد على الأقل"
  if (!/[^\p{L}\p{N}\s]/u.test(value)) return "كلمة المرور لازم يكون فيها رمز مميز واحد على الأقل"

  return null
}
