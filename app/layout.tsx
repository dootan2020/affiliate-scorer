import type { Metadata } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { SidebarAwareMain } from "@/components/layout/sidebar-aware-main";
import { ThemeProvider } from "@/components/theme-provider";
import { SetupBanner } from "@/components/shared/setup-banner";
import { CommandPalette } from "@/components/shared/command-palette";
import { TaskProgressWidget } from "@/components/shared/task-progress-widget";
import { MobileFab } from "@/components/shared/mobile-fab";
import { PwaHead } from "@/components/shared/pwa-head";
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PASTR" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={`${beVietnamPro.variable} ${geistMono.variable} font-sans antialiased bg-gray-50 dark:bg-slate-950 min-h-screen`}
      >
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <SidebarAwareMain>
              <SetupBanner />
              {children}
            </SidebarAwareMain>
          </div>
          <MobileFab />
          <PwaHead />
          <CommandPalette />
          <TaskProgressWidget />
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
