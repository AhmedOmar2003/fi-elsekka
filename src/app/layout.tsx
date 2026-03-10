import type { Metadata } from "next";
import { Tajawal, Cairo } from "next/font/google";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500"],
  variable: "--font-tajawal",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["600", "700"],
  variable: "--font-cairo",
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
        className={`${tajawal.variable} ${cairo.variable} font-sans antialiased bg-gray-950 text-gray-100 min-h-screen flex flex-col`}
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
