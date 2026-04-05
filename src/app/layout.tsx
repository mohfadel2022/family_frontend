import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "صندوق العائلة",
  description: "نظام محاسبي ذكي لإدارة الشؤون المالية للعائلة",
  icons: {
    icon: "/favicon.svg",
  },
};

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { PageThemeProvider } from "@/context/PageThemeContext";
import AppShell from "@/components/layout/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased h-screen overflow-hidden flex bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={0}>
            <Toaster position="top-center" dir="rtl" richColors />
            <AuthProvider>
              <PageThemeProvider>
                <AppShell>
                  {children}
                </AppShell>
              </PageThemeProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
