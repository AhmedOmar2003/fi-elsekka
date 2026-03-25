const CATEGORY_CODES: Record<string, string> = {
  "ملابس وأزياء": "FAS",
  "سوبر ماركت": "SUP",
  "ألعاب أطفال": "TOY",
  "طعام": "FOD",
  "إلكترونيات": "ELE",
  "أدوات منزلية": "HOM",
  "العناية الشخصية": "CAR",
  "عناية شخصية": "CAR",
  "صيدلية": "PHA",
}

const VALUE_LABELS: Record<string, string> = {
  men: "رجالي",
  women: "نسائي",
  boys: "أولاد",
  girls: "بنات",
  unisex: "للجنسين",
  baby: "بيبي",
  kids: "أطفال",
  teens: "مراهقين",
  adults: "كبار",
  summer: "صيفي",
  winter: "شتوي",
  spring: "ربيعي",
  autumn: "خريفي",
  all_season: "كل المواسم",
}

type SuggestionInput = {
  name: string
  brand?: string
  categoryName?: string
  taxonomyPrimary?: string
  taxonomySecondary?: string
  taxonomyTertiary?: string
  taxonomyPrimaryLabel?: string
  taxonomySecondaryLabel?: string
  taxonomyTertiaryLabel?: string
  productType?: string
  gender?: string
  ageGroup?: string
  season?: string
  style?: string
  material?: string
  colorFamily?: string
  sizeGroup?: string
}

function normalizeText(value?: string) {
  return String(value || "").trim()
}

function uniqueList(values: string[]) {
  const seen = new Set<string>()
  return values.filter((item) => {
    const normalized = item.trim().toLowerCase()
    if (!normalized || seen.has(normalized)) return false
    seen.add(normalized)
    return true
  })
}

function keywordizeTitle(title: string) {
  return title
    .split(/[\s\-_/،,.()]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    .slice(0, 6)
}

function toCode(value?: string, fallback = "GEN") {
  const normalized = normalizeText(value)
  if (!normalized) return fallback

  const words = normalized
    .replace(/[^a-zA-Z0-9_\-\s]/g, " ")
    .split(/[\s_-]+/g)
    .filter(Boolean)

  if (words.length === 0) return fallback
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

function toReadableLabel(value?: string) {
  const normalized = normalizeText(value)
  return VALUE_LABELS[normalized] || normalized
}

export function getAdminProductSuggestions(input: SuggestionInput) {
  const name = normalizeText(input.name)
  const categoryName = normalizeText(input.categoryName)
  const brand = normalizeText(input.brand)
  const productType = normalizeText(input.productType || input.taxonomyTertiaryLabel || input.taxonomySecondaryLabel)
  const primaryLabel = normalizeText(input.taxonomyPrimaryLabel)
  const secondaryLabel = normalizeText(input.taxonomySecondaryLabel)
  const tertiaryLabel = normalizeText(input.taxonomyTertiaryLabel)
  const genderLabel = toReadableLabel(input.gender)
  const ageGroupLabel = toReadableLabel(input.ageGroup)
  const seasonLabel = toReadableLabel(input.season)
  const style = normalizeText(input.style)
  const material = normalizeText(input.material)
  const colorFamily = normalizeText(input.colorFamily)
  const sizeGroup = normalizeText(input.sizeGroup)

  const titleWords = keywordizeTitle(name)
  const tags = uniqueList([
    name,
    categoryName,
    primaryLabel,
    secondaryLabel,
    tertiaryLabel,
    brand,
    productType,
    genderLabel,
    ageGroupLabel,
    seasonLabel,
    style,
    material,
    colorFamily,
    ...titleWords,
  ])

  const keywords = uniqueList([
    name,
    [name, categoryName].filter(Boolean).join(" "),
    [name, secondaryLabel || tertiaryLabel || primaryLabel].filter(Boolean).join(" "),
    [brand, name].filter(Boolean).join(" "),
    [categoryName, secondaryLabel].filter(Boolean).join(" "),
    [name, seasonLabel].filter(Boolean).join(" "),
    [name, genderLabel].filter(Boolean).join(" "),
    [name, material].filter(Boolean).join(" "),
    [name, colorFamily].filter(Boolean).join(" "),
    [name, ageGroupLabel].filter(Boolean).join(" "),
  ]).filter(Boolean)

  const categoryCode = CATEGORY_CODES[categoryName] || toCode(categoryName, "CAT")
  const primaryCode = toCode(input.taxonomyPrimary, "GEN")
  const detailSource = input.taxonomyTertiary || input.taxonomySecondary || productType || name
  const detailCode = toCode(detailSource, "ITM")
  const sku = `${categoryCode}-${primaryCode}-${detailCode}-001`

  return {
    sku,
    productType: productType || secondaryLabel || primaryLabel || "",
    tags: tags.slice(0, 8),
    keywords: keywords.slice(0, 10),
  }
}
