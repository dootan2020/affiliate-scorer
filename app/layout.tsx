import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { NavHeader } from "@/components/layout/nav-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AffiliateScorer — AI Chọn Sản Phẩm Affiliate",
  description:
    "Công cụ AI chấm điểm sản phẩm affiliate từ FastMoss/KaloData. Học từ kết quả thật để cải thiện scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <NavHeader />
        <main className="container mx-auto px-4 py-6">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
