import { Baby, Home as HomeIcon, Laptop, LayoutGrid, Pill, Shirt, ShoppingBasket, Sparkles, UtensilsCrossed } from "lucide-react";
import type { ElementType } from "react";

export interface CategoryDesign {
    iconComponent: ElementType;
    color: string;
    iconColor: string;
}

export function getCategoryDesign(name: string): CategoryDesign {
    switch (name.trim()) {
        case "ملابس وأزياء":
            return {
                iconComponent: Shirt,
                color: "from-rose-500/20 to-rose-500/5 hover:from-rose-500/30",
                iconColor: "text-rose-500 bg-rose-500/10",
            };
        case "إلكترونيات":
            return {
                iconComponent: Laptop,
                color: "from-slate-500/20 to-slate-500/5 hover:from-slate-500/30",
                iconColor: "text-slate-400 bg-slate-500/10",
            };
        case "صيدلية":
            return {
                iconComponent: Pill,
                color: "from-blue-500/20 to-blue-500/5 hover:from-blue-500/30",
                iconColor: "text-blue-500 bg-blue-500/10",
            };
        case "سوبر ماركت":
            return {
                iconComponent: ShoppingBasket,
                color: "from-emerald-500/20 to-emerald-500/5 hover:from-emerald-500/30",
                iconColor: "text-emerald-500 bg-emerald-500/10",
            };
        case "طعام":
            return {
                iconComponent: UtensilsCrossed,
                color: "from-orange-500/20 to-orange-500/5 hover:from-orange-500/30",
                iconColor: "text-orange-500 bg-orange-500/10",
            };
        case "ألعاب أطفال":
            return {
                iconComponent: Baby,
                color: "from-purple-500/20 to-purple-500/5 hover:from-purple-500/30",
                iconColor: "text-purple-500 bg-purple-500/10",
            };
        case "عناية شخصية":
            return {
                iconComponent: Sparkles,
                color: "from-pink-500/20 to-pink-500/5 hover:from-pink-500/30",
                iconColor: "text-pink-500 bg-pink-500/10",
            };
        case "أدوات منزلية":
            return {
                iconComponent: HomeIcon,
                color: "from-amber-500/20 to-amber-500/5 hover:from-amber-500/30",
                iconColor: "text-amber-500 bg-amber-500/10",
            };
        default:
            return {
                iconComponent: LayoutGrid,
                color: "from-gray-500/20 to-gray-500/5 hover:from-gray-500/30",
                iconColor: "text-gray-500 bg-gray-500/10",
            };
    }
}
