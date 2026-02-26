import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "Content Factory — AI Sản Xuất Video Affiliate",
  description:
    "Công cụ AI giúp sản xuất 10+ video affiliate TikTok mỗi ngày",
  openGraph: {
    title: "Content Factory — AI Sản Xuất Video Affiliate",
    description:
      "Công cụ AI giúp sản xuất 10+ video affiliate TikTok mỗi ngày",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 dark:bg-slate-950 min-h-screen`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            {/* Offset for desktop sidebar width; top/bottom offset for mobile bars */}
            <main className="flex-1 overflow-auto md:ml-60 pt-14 pb-20 md:pt-0 md:pb-0">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
