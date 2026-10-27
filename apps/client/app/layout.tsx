import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast";
import { ThemeInit } from "@/lib/theme";

export const metadata: Metadata = {
  title: "PGG Marketing Field App",
  description: "Client Onboarding & Investor Communication — Prestige Glamour Group",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <AuthProvider>
          <ToastProvider>
            <ThemeInit />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
