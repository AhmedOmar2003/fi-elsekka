import { CategoryCard } from "@/components/ui/category-card";
import { getCategoryDesign } from "@/lib/category-design";
import { fetchCategoriesServer } from "@/services/serverCategoriesService";

const categoryPriority = ["ملابس وأزياء", "سوبر ماركت", "طعام", "صيدلية", "إلكترونيات", "ألعاب أطفال", "أدوات منزلية", "عناية شخصية"];

export async function HomeCategoriesList() {
    const categories = await fetchCategoriesServer();

    if (categories.length === 0) {
        return null;
    }

    const sortedCategories = [...categories].sort((a, b) => {
        const aIndex = categoryPriority.indexOf(a.name);
        const bIndex = categoryPriority.indexOf(b.name);

        if (aIndex !== -1 || bIndex !== -1) {
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        }

        return a.name.localeCompare(b.name, "ar");
    });

    return (
        <div className="flex items-start gap-4 overflow-x-auto px-4 pb-4 pt-2 no-scrollbar -mx-4 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 md:grid-cols-6">
            {sortedCategories.map((cat) => {
                const design = getCategoryDesign(cat.name);
                return (
                    <div key={cat.id} className="snap-start shrink-0 w-[31vw] min-w-[116px] sm:w-auto sm:min-w-0">
                        <CategoryCard
                            slug={cat.id}
                            name={cat.name}
                            icon={<design.iconComponent className="w-8 h-8 sm:w-10 sm:h-10 text-current" />}
                            className="w-full h-full"
                        />
                    </div>
                );
            })}
        </div>
    );
}
