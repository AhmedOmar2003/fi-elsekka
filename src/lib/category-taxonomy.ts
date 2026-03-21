export type TaxonomyOption = {
  value: string;
  label: string;
  children?: TaxonomyOption[];
};

export type CategoryTaxonomyConfig = {
  categoryName: string;
  primaryLabel: string;
  secondaryLabel: string;
  options: TaxonomyOption[];
};

export type ProductTaxonomySelection = {
  primary: string;
  secondary: string;
};

const CLOTHING_TAXONOMY: CategoryTaxonomyConfig = {
  categoryName: "ملابس وأزياء",
  primaryLabel: "التصنيف الرئيسي",
  secondaryLabel: "التصنيف الفرعي",
  options: [
    {
      value: "men",
      label: "ملابس رجالي",
      children: [
        { value: "pants", label: "بناطيل" },
        { value: "tshirts", label: "تيشيرتات" },
        { value: "shirts", label: "قمصان" },
        { value: "underwear", label: "ملابس داخلية" },
        { value: "sportswear", label: "ملابس رياضية" },
      ],
    },
    {
      value: "women",
      label: "ملابس نسائي",
      children: [
        { value: "dresses", label: "فساتين" },
        { value: "blouses", label: "بلوزات" },
        { value: "pants", label: "بناطيل" },
        { value: "abayas", label: "عبايات" },
        { value: "sleepwear", label: "ملابس نوم" },
      ],
    },
    {
      value: "kids",
      label: "ملابس أطفالي",
      children: [
        { value: "baby_sets", label: "طقم أطفال" },
        { value: "schoolwear", label: "ملابس مدرسة" },
        { value: "winterwear", label: "ملابس شتوي" },
        { value: "summerwear", label: "ملابس صيفي" },
      ],
    },
    {
      value: "youth",
      label: "ملابس شبابي",
      children: [
        { value: "hoodies", label: "هوديز" },
        { value: "oversized", label: "أوفر سايز" },
        { value: "jeans", label: "جينز" },
        { value: "sets", label: "أطقم" },
      ],
    },
  ],
};

const CATEGORY_TAXONOMIES: CategoryTaxonomyConfig[] = [CLOTHING_TAXONOMY];

export function getCategoryTaxonomyConfig(categoryName?: string | null) {
  if (!categoryName) return null;
  return CATEGORY_TAXONOMIES.find((config) => config.categoryName === categoryName.trim()) || null;
}

export function getTaxonomySelection(specifications?: Record<string, any> | null): ProductTaxonomySelection {
  return {
    primary: String(specifications?.category_taxonomy?.primary || "").trim(),
    secondary: String(specifications?.category_taxonomy?.secondary || "").trim(),
  };
}

export function getTaxonomyPrimaryOptions(categoryName?: string | null) {
  return getCategoryTaxonomyConfig(categoryName)?.options || [];
}

export function getTaxonomySecondaryOptions(categoryName?: string | null, primaryValue?: string | null) {
  if (!primaryValue) return [];
  const primary = getTaxonomyPrimaryOptions(categoryName).find((option) => option.value === primaryValue);
  return primary?.children || [];
}

export function getTaxonomyLabel(
  categoryName?: string | null,
  primaryValue?: string | null,
  secondaryValue?: string | null
) {
  const primary = getTaxonomyPrimaryOptions(categoryName).find((option) => option.value === primaryValue);
  const secondary = getTaxonomySecondaryOptions(categoryName, primaryValue).find((option) => option.value === secondaryValue);

  return {
    primary: primary?.label || "",
    secondary: secondary?.label || "",
  };
}

export function matchesProductTaxonomy(
  specifications: Record<string, any> | null | undefined,
  filters: ProductTaxonomySelection
) {
  const selection = getTaxonomySelection(specifications);
  if (filters.primary && selection.primary !== filters.primary) return false;
  if (filters.secondary && selection.secondary !== filters.secondary) return false;
  return true;
}
