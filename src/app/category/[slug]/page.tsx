import { cache } from "react"
import type { Metadata } from "next"
import CategoryPageClient from "./category-page-client"
import {
  fetchCategoryByIdServer,
  fetchPaginatedProductsServer,
} from "@/services/serverCatalogService"
import { fetchRestaurantsServer } from "@/services/serverRestaurantsService"
import {
  getCategoryTaxonomyConfig,
  getTaxonomyPrimaryOptions,
} from "@/lib/category-taxonomy"
import { fetchPublicAppSettingsServer } from "@/services/serverAppSettingsService"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fi-elsekka.vercel.app"
const PAGE_SIZE = 12

export const revalidate = 300

const getCategoryPageData = cache(async (slug: string) => {
  if (slug === "all") {
    const { products, hasMore } = await fetchPaginatedProductsServer(0, PAGE_SIZE)
    return {
      category: null,
      products,
      hasMore,
      restaurants: [],
    }
  }

  const [category, paginatedResult] = await Promise.all([
    fetchCategoryByIdServer(slug),
    fetchPaginatedProductsServer(0, PAGE_SIZE, slug),
  ])

  const restaurants =
    category?.name === "طعام"
      ? await fetchRestaurantsServer(category.id)
      : []

  return {
    category,
    products: paginatedResult.products,
    hasMore: paginatedResult.hasMore,
    restaurants,
  }
})

function buildCategoryDescription(categoryName: string, categoryDescription?: string | null) {
  if (categoryDescription?.trim()) return categoryDescription.trim()
  return `شوف منتجات ${categoryName} على في السكة، واختار اللي يناسبك بسهولة ومن غير لفة كتير.`
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { q } = await searchParams

  if (slug === "all") {
    const settings = await fetchPublicAppSettingsServer()
    const siteName = settings.siteName || "في السكة"
    const query = q?.trim()
    const title = query ? `نتايج البحث عن ${query} | ${siteName}` : `كل المنتجات | ${siteName}`
    const description = query
      ? `شوف نتايج البحث عن ${query} على ${siteName}، ووصّل اللي يعجبك لحد عندك بسهولة.`
      : `لف في كل منتجات ${siteName} من مكان واحد، واختار اللي يناسبك بسرعة.`
    const url = query
      ? `${SITE_URL}/category/all?q=${encodeURIComponent(query)}`
      : `${SITE_URL}/category/all`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName,
        locale: "ar_EG",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    }
  }

  const { category } = await getCategoryPageData(slug)
  const settings = await fetchPublicAppSettingsServer()
  const siteName = settings.siteName || "في السكة"
  const categoryName = category?.name || "قسم المنتجات"
  const description = buildCategoryDescription(categoryName, category?.description)
  const taxonomyConfig = getCategoryTaxonomyConfig(category?.name)
  const taxonomyKeywords = taxonomyConfig
    ? getTaxonomyPrimaryOptions(category?.name).map((option) => option.label)
    : []
  const url = `${SITE_URL}/category/${slug}`

  return {
    title: `${categoryName} | ${siteName}`,
    description,
    keywords: [categoryName, ...taxonomyKeywords, siteName, "توصيل", "طلبات"],
    alternates: { canonical: url },
    openGraph: {
      title: `${categoryName} | ${siteName}`,
      description,
      url,
      siteName,
      locale: "ar_EG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | ${siteName}`,
      description,
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { slug } = await params
  const { q } = await searchParams
  const { category, products, hasMore, restaurants } = await getCategoryPageData(slug)

  return (
    <CategoryPageClient
      initialCategory={category}
      initialProducts={products}
      initialHasMore={hasMore}
      initialRestaurants={restaurants}
      initialSearchQuery={q?.trim() || ""}
    />
  )
}
