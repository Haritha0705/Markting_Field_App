import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast";
import { ThemeInit } from "@/lib/theme";
import { PwaInit } from "@/components/pwa";

export const metadata: Metadata = {
  title: "PGG Marketing Field App",
  description: "Client Onboarding & Investor Communication — Prestige Glamour Group",
  applicationName: "PGG Field App",
  appleWebApp: {
    capable: true,
    title: "PGG Field",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050B08",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <AuthProvider>
          <ToastProvider>
            <ThemeInit />
            <PwaInit />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
