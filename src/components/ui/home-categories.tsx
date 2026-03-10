"use client"

import * as React from "react"
import Link from "next/link"
import { CategoryCard } from "@/components/ui/category-card"
import { getCategoryDesign } from "@/services/categoriesService"
import { useProducts } from "@/contexts/ProductsContext"

export function HomeCategoriesList() {
    const { categories, isLoadingCategories: isLoading } = useProducts();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (categories.length === 0) {
        return null;
    }

    return (
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-6 items-start">
            {categories.map((cat) => {
                const design = getCategoryDesign(cat.name);
                return (
                    <CategoryCard
                        key={cat.id}
                        slug={cat.id}
                        name={cat.name}
                        icon={<design.iconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-current" />}
                        className="w-[100px] sm:w-auto"
                    />
                )
            })}
        </div>
    )
}
