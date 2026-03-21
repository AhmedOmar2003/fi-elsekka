import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fi-elsekka.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
    supabase.from("categories").select("id, updated_at"),
    supabase.from("products").select("id, created_at, updated_at"),
  ]);
  const categories = categoriesData || [];
  const products = productsData || [];

  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/categories",
    "/offers",
    "/about",
    "/contact",
    "/faq",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.id}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(product.created_at),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
