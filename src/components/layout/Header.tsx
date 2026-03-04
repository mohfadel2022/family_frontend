"use client";

import React, { useEffect, useState } from 'react';
import { Menu, UserCircle, Settings, LogOut } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

import { useAuth, UserRole } from '@/context/AuthContext';

const Header = () => {
    const { toggleSidebar } = useSidebar();
    const { user, loading } = useAuth();

    const getRoleLabel = (role?: UserRole) => {
        switch (role) {
            case 'ADMIN': return 'مدير النظام';
            case 'RESPONSIBLE': return 'مسؤول النظام';
            case 'ENCARGADO': return 'مسؤول جهة';
            default: return 'مستخدم';
        }
    };

    const userInitial = user?.name ? user.name.charAt(0) : 'ع';

    return (
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 z-10 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-slate-600 hover:text-slate-900 rounded-xl"
                    aria-label="Toggle Sidebar"
                >
                    <Menu size={20} className="transition-transform duration-300 active:scale-95" />
                </Button>
                <div className="flex flex-col">
                    <h2 className="text-base md:text-lg font-black text-slate-800 tracking-tight">النظام المحاسبي</h2>
                    <span className="text-[8px] md:text-[9px] text-blue-600 font-bold uppercase tracking-wider leading-none">Advanced ERP System</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end mr-3 border-r border-slate-200 pr-4">
                    <span className="text-sm font-bold text-slate-800">{loading ? 'جاري التحميل...' : user?.name}</span>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"></span>
                        {getRoleLabel(user?.role)}
                    </span>
                </div>

                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-1 focus-visible:ring-blue-500 p-0">
                            <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm transition-transform hover:scale-105 duration-200">
                                <AvatarImage src="" alt={user?.name || 'User'} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-sm">
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name || 'مستخدم النظام'}</p>
                                <p className="text-xs leading-none text-slate-500">
                                    {user?.username || 'user@example.com'}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/">
                                <UserCircle className="mr-2 ml-2 h-4 w-4 text-slate-500" />
                                <span>الملف الشخصي</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/settings">
                                <Settings className="mr-2 ml-2 h-4 w-4 text-slate-500" />
                                <span>الإعدادات</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600">
                            <Link href="/logout">
                                <LogOut className="mr-2 ml-2 h-4 w-4" />
                                <span>تسجيل الخروج</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Header;
