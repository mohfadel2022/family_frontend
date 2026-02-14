import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/context/SidebarContext";
import Header from "@/components/layout/Header";


const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "900"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "صندوق العائلة | النظام المحاسبي المتطور",
  description: "نظام محاسبي ذكي لإدارة الشؤون المالية للعائلة",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-sans antialiased flex bg-slate-50/50 text-slate-900`}
      >
        <Toaster position="top-center" dir="rtl" richColors />
        <SidebarProvider>
          <Sidebar aria-label="Sidebar Navigation" />
          <main className="flex-1 min-h-screen overflow-x-hidden flex flex-col">
            <Header />
            <div className="p-6 flex-1">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
