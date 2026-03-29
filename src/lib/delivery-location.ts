export function normalizeDisplayCity(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase()

  if (!normalized) return ""
  if (normalized === "cairo" || normalized === "القاهرة") return "الدقهلية"
  if (normalized === "giza" || normalized === "الجيزة") return "القرى المجاورة"

  return String(value || "").trim()
}
