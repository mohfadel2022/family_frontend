"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    ChevronRight,
    Menu,
    Receipt,
    PieChart,
    Globe,
    History,
    Shield,
    LogOutIcon
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';

const Sidebar = () => {
    const { isOpen } = useSidebar();
    const pathname = usePathname();

    const menuItems = [
        { title: 'لوحة التحكم', icon: LayoutDashboard, href: '/' },
        { title: 'قيود اليومية', icon: Receipt, href: '/journal' },
        { title: 'شجرة الحسابات', icon: FileText, href: '/accounts' },
        { title: 'التقارير المالية', icon: PieChart, href: '/reports' },
        { title: 'إغلاق الفترات', icon: History, href: '/settings/periods' },
        { title: 'سجل العمليات', icon: Shield, href: '/settings/audit-logs' },
    ];

    return (
        <aside
            className={cn(
                "bg-[#0f172a] text-slate-300 h-screen transition-all duration-500 flex flex-col sticky top-0 border-l border-slate-800/50 shadow-2xl z-20",
                isOpen ? "w-72" : "w-24"
            )}
        >
            <div className="p-8 flex items-center justify-center border-b border-slate-800/50 mb-4">
                {isOpen ? (
                    <div className="flex flex-col animate-in slide-in-from-right duration-500">
                        <h1 className="text-2xl font-black bg-gradient-to-l from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent tracking-tighter">
                            صندوق العائلة
                        </h1>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">Family Treasury v2</span>
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">ص</div>
                )}
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                                    : "hover:bg-slate-800/40 text-slate-400 hover:text-slate-100"
                            )}
                        >
                            {isActive && <div className="absolute inset-y-0 right-0 w-1 bg-blue-500 rounded-l-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>}
                            <item.icon
                                size={18}
                                className={cn(
                                    "transition-transform duration-300 group-hover:scale-110",
                                    isActive ? "text-blue-400" : "group-hover:text-blue-400"
                                )}
                            />
                            {isOpen && <span className="font-bold text-[13px] tracking-tight">{item.title}</span>}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800/50 space-y-1">
                <Link
                    href="/settings"
                    className="flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:bg-slate-800/40 hover:text-slate-100 transition-all group"
                >
                    <Settings size={18} className="group-hover:rotate-45 transition-transform duration-500" />
                    {isOpen && <span className="font-bold text-[13px]">الإعدادات العامة</span>}
                </Link>
                <Link
                    href="/logout"
                    className="flex items-center gap-4 p-3 rounded-xl text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                >
                    <LogOutIcon size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    {isOpen && <span className="font-bold text-[13px]">تسجيل الخروج</span>}
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
