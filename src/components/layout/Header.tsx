"use client";

import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';

const Header = () => {
    const { toggleSidebar } = useSidebar();

    return (
        <header className="bg-white/80 backdrop-blur-md border-b z-10 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-600 hover:text-slate-900 group"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">النظام المحاسبي</h2>
                    <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest leading-none">Advanced ERP System</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-700">عبدالرحمن الفهيد</span>
                    <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        متصل الآن
                    </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-100 flex items-center justify-center text-white font-black text-sm border border-white/20">
                    ع
                </div>
            </div>
        </header>
    );
};

export default Header;
