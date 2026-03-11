import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Lalezar } from "next/font/google";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body
        className={`${ibmPlex.variable} ${lalezar.variable} font-sans antialiased bg-gray-950 text-gray-100 min-h-screen flex flex-col`}
      >
        <Providers>
          {children}
          <MobileNav />
          <Toaster position="top-center" richColors theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
