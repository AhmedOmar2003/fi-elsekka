import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Lalezar } from "next/font/google";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { InstallPrompt } from "@/components/ui/install-prompt";
import { MaintenanceModeOverlay } from "@/components/system/maintenance-mode-overlay";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fi-elsekka.vercel.app";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "في السكة | اطلب اللي محتاجه ويوصلك لحد عندك",
    template: "%s | في السكة",
  },
  description: "في السكة سوق محلي ذكي في مصر. اطلب من السوبر ماركت والصيدلية والملابس وأكتر، والدفع عند الاستلام والتوصيل لحد باب البيت.",
  keywords: [
    "في السكة",
    "توصيل في مصر",
    "سوبر ماركت اونلاين",
    "صيدلية اونلاين",
    "ملابس اونلاين",
    "الدفع عند الاستلام",
  ],
  manifest: "/manifest.json",
  applicationName: "في السكة",
  category: "shopping",
  icons: {
    icon: [
      { url: "/notification-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/notification-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/notification-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/notification-icon-192.png"],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: SITE_URL,
    siteName: "في السكة",
    title: "في السكة | اطلب اللي محتاجه ويوصلك لحد عندك",
    description: "سوبر ماركت وصيدلية وملابس وأكتر، بطلب سهل وتوصيل سريع والدفع عند الاستلام.",
    images: [
      {
        url: "/notification-icon-512.png",
        width: 512,
        height: 512,
        alt: "في السكة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "في السكة | اطلب اللي محتاجه ويوصلك لحد عندك",
    description: "سوبر ماركت وصيدلية وملابس وأكتر، بطلب سهل وتوصيل سريع والدفع عند الاستلام.",
    images: ["/notification-icon-512.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "في السكة",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:right-4 focus:z-50 focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-xl font-bold font-sans"
        >
          القفز إلى المحتوى الرئيسي
        </a>
        <Providers>
          <MaintenanceModeOverlay />
          <div id="main-content" className="flex-1 flex flex-col w-full outline-none" tabIndex={-1}>
            {children}
          </div>
          <MobileNav />
          <InstallPrompt />
          <Toaster className="font-sans" position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
