"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard, type ProductCardProps } from "@/components/ui/product-card";

type RestaurantMenuItem = ProductCardProps & {
  section: string;
};

type RestaurantMenuBrowserProps = {
  items: RestaurantMenuItem[];
  restaurantName: string;
  sections: string[];
};

const PAGE_SIZE = 12;

export function RestaurantMenuBrowser({
  items,
  restaurantName,
  sections,
}: RestaurantMenuBrowserProps) {
  const [selectedSection, setSelectedSection] = useState("الكل");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const availableSections = useMemo(() => {
    const dynamicSections = items
      .map((item) => item.section.trim())
      .filter(Boolean);

    return ["الكل", ...Array.from(new Set([...sections, ...dynamicSections]))];
  }, [items, sections]);

  const filteredItems = useMemo(() => {
    if (selectedSection === "الكل") return items;
    return items.filter((item) => item.section === selectedSection);
  }, [items, selectedSection]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedSection]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = filteredItems.length > visibleCount;

  return (
    <div className="space-y-6">
      {availableSections.length > 1 ? (
        <div className="sticky top-[72px] z-10 -mx-1 overflow-x-auto pb-1 md:top-[88px]">
          <div className="inline-flex min-w-full gap-2 rounded-[28px] border border-surface-hover bg-surface/95 p-2 backdrop-blur">
            {availableSections.map((section) => {
              const isActive = selectedSection === section;
              const sectionCount =
                section === "الكل" ? items.length : items.filter((item) => item.section === section).length;

              return (
                <button
                  key={section}
                  type="button"
                  onClick={() => setSelectedSection(section)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-[var(--shadow-material-1)]"
                      : "bg-background/70 text-gray-300 hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <span>{section}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      isActive ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {sectionCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-surface-hover bg-surface px-6 py-14 text-center">
          <p className="text-lg font-black text-foreground">لسه مفيش منتجات تحت التصنيف ده</p>
          <p className="mt-2 text-sm text-gray-500">جرّب تبويب تاني أو ارجع لاحقًا، وإحنا هنكمل منيو {restaurantName} أول بأول.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
            {visibleItems.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>

          {hasMore ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl px-6"
                onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              >
                عرض منتجات أكثر
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
