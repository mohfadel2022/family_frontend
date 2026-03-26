"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/context/SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Auth routes that should NOT have the main sidebar/header shell
    const isAuthRoute = pathname === '/login' || pathname === '/logout' || pathname.startsWith('/auth/reset-password');

    if (isAuthRoute) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <Sidebar aria-label="Sidebar Navigation" />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <div className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    );
}
