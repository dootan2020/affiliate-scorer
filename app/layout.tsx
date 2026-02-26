import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SetupBanner } from "@/components/shared/setup-banner";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PASTR — AI Video Affiliate",
    template: "%s | PASTR",
  },
  description:
    "Paste links. Ship videos. Learn fast. Công cụ AI sản xuất video affiliate TikTok.",
  openGraph: {
    title: "PASTR — Paste links. Ship videos. Learn fast.",
    description:
      "Công cụ AI giúp sản xuất video affiliate TikTok nhanh hơn",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PASTR — AI Video Affiliate",
    description: "Paste links. Ship videos. Learn fast.",
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
        className={`${beVietnamPro.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 dark:bg-slate-950 min-h-screen`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            {/* Offset for desktop sidebar width; top/bottom offset for mobile bars */}
            <main className="flex-1 overflow-auto md:ml-60 pt-14 pb-20 md:pt-0 md:pb-0">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <SetupBanner />
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
