import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/context/SidebarContext";
import Header from "@/components/layout/Header";
import { TooltipProvider } from "@/components/ui/tooltip";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "صندوق العائلة | النظام المحاسبي المتطور",
  description: "نظام محاسبي ذكي لإدارة الشؤون المالية للعائلة",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-sans antialiased h-screen overflow-hidden flex bg-slate-50 text-slate-900`}
      >
        <TooltipProvider delayDuration={0}>
          <Toaster position="top-center" dir="rtl" richColors />
          <AuthProvider>
            <SidebarProvider>
              <Sidebar aria-label="Sidebar Navigation" />
              <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">
                  {children}
                </div>
              </main>
            </SidebarProvider>
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
