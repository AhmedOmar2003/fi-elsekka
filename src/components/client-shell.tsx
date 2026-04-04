"use client";

import dynamic from "next/dynamic";

const MobileNav = dynamic(() => import("@/components/layout/mobile-nav").then((mod) => mod.MobileNav), {
    ssr: false,
});

const MaintenanceModeOverlay = dynamic(
    () => import("@/components/system/maintenance-mode-overlay").then((mod) => mod.MaintenanceModeOverlay),
    { ssr: false }
);

const Toaster = dynamic(() => import("sonner").then((mod) => mod.Toaster), {
    ssr: false,
});

export function ClientShell() {
    return (
        <>
            <MaintenanceModeOverlay />
            <MobileNav />
            <Toaster className="font-sans" position="top-center" richColors />
        </>
    );
}
