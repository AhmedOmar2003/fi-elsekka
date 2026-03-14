import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Lalezar } from "next/font/google";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { InstallPrompt } from "@/components/ui/install-prompt";
import "./globals.css";

const ibmPlex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-ibm",
  display: "swap",
});

const lalezar = Lalezar({
  subsets: ["arabic"],
  weight: ["400"],
  variable: "--font-lalezar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "في السكة - Fi El Sekka",
  description: "Your smart local marketplace companion in Egypt. Fast, friendly, and reliable.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "في السكة",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${ibmPlex.variable} ${lalezar.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300`}
      >
        <Providers>
          {children}
          <MobileNav />
          <InstallPrompt />
          <Toaster className="font-sans" position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
