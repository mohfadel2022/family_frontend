"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
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
import { toast } from 'sonner';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useAuth, UserRole } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { META_BASE, getAuthHeader, SUB_BASE, API_BASE } from '@/lib/api';

const Header = () => {
    const { toggleSidebar } = useSidebar();
    const { user, loading, checkPermission } = useAuth();
    const [systemConfig, setSystemConfig] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchConfig = () => {
        if (user && checkPermission('DB_BACKUP')) {
            axios.get(`${META_BASE}/system-config`, getAuthHeader())
                .then((res: any) => setSystemConfig(res.data))
                .catch((err: any) => console.error("Header: Failed to fetch config", err));
        }
    };

    const fetchNotifications = () => {
        if (user) {
            axios.get(`${API_BASE}/notifications`, getAuthHeader())
                .then((res: any) => setNotifications(res.data))
                .catch((err: any) => console.error("Header: Failed to fetch notifications", err));
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchNotifications();

        window.addEventListener('backup-success', fetchConfig);
        
        // Polling for notifications every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => {
            window.removeEventListener('backup-success', fetchConfig);
            clearInterval(interval);
        };
    }, [user]);

    const handleMarkAsRead = async (id: string, link?: string) => {
        try {
            await axios.put(`${API_BASE}/notifications/${id}/read`, {}, getAuthHeader());
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            if (link) window.location.href = link;
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const handleMarkAsCompleted = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await axios.put(`${API_BASE}/notifications/${id}/complete`, {}, getAuthHeader());
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isCompleted: true, isRead: true } : n));
            toast.success("تم إنجاز المهمة");
        } catch (error) {
            console.error("Failed to mark as completed", error);
            toast.error("فشل تحديث حالة المهمة");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await axios.put(`${API_BASE}/notifications/read-all`, {}, getAuthHeader());
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const isBackupOverdue = systemConfig?.nextBackupAt &&
        systemConfig.backupFrequency !== 'NONE' &&
        new Date(systemConfig.nextBackupAt) < new Date();

    const getRoleLabel = (role?: UserRole) => {
        switch (role) {
            case 'ADMIN': return 'مدير النظام';
            case 'RESPONSABLE': return 'مسؤول النظام';
            case 'ENCARGADO': return 'مسؤول جهة';
            default: return 'مستخدم';
        }
    };

    const userInitial = user?.name ? user.name.charAt(0) : 'ع';
    
    const isOp = (n: any) => n.category === 'OPERATION' || ['MEMBER', 'COLLECTION', 'RECEIPT', 'PAYMENT', 'JOURNAL'].includes(n.type);
    const isTask = (n: any) => n.category === 'TASK' || (!n.category && !isOp(n)) || n.type === 'AUDIT';

    const unreadOpCount = notifications.filter(n => !n.isRead && isOp(n)).length;
    const unreadTaskCount = notifications.filter(n => !n.isRead && !n.isCompleted && isTask(n)).length + (isBackupOverdue ? 1 : 0);
    
    const opNotifications = notifications.filter(isOp);
    const taskNotifications = notifications.filter(n => isTask(n) && !n.isCompleted);

    const renderNotificationItem = (notification: any) => (
        <DropdownMenuItem key={notification.id} asChild className="p-0 focus:bg-transparent cursor-pointer mb-1">
            <div 
                onClick={() => handleMarkAsRead(notification.id, notification.link)}
                className={cn(
                    "flex flex-col gap-1 p-3 mx-1 rounded-xl transition-colors group",
                    !notification.isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-muted/50 opacity-70 hover:opacity-100"
                )}
            >
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform",
                        !notification.isRead ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                    )}>
                        {notification.type === 'MEMBER' && <APP_ICONS.SHARED.USER size={16} />}
                        {notification.type === 'COLLECTION' && <APP_ICONS.MODULES.COLLECT size={16} />}
                        {notification.type === 'RECEIPT' && <APP_ICONS.MODULES.RECEIPTS size={16} />}
                        {notification.type === 'PAYMENT' && <APP_ICONS.MODULES.PAYMENTS size={16} />}
                        {notification.type === 'JOURNAL' && <APP_ICONS.MODULES.JOURNAL size={16} />}
                        {notification.type === 'AUDIT' && <APP_ICONS.MODULES.AUDIT size={16} />}
                        {(!['MEMBER', 'COLLECTION', 'RECEIPT', 'PAYMENT', 'JOURNAL', 'AUDIT'].includes(notification.type)) && <APP_ICONS.SHARED.BELL size={16} />}
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-center">
                            <p className={cn("text-[13px] font-black leading-tight", !notification.isRead ? "text-blue-900" : "text-foreground")}>
                                {notification.title}
                            </p>
                            {!notification.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>}
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground leading-relaxed line-clamp-2">{notification.message}</p>
                    </div>
                </div>

                {/* Mark as Completed for tasks */}
                {notification.category === 'TASK' && !notification.isCompleted && (
                    <div className="mt-2 flex justify-end">
                        <button 
                            onClick={(e) => handleMarkAsCompleted(e, notification.id)}
                            className="text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-100 flex items-center gap-1.5"
                        >
                            <APP_ICONS.STATE.SUCCESS size={12} />
                            تحديد كمكتمل
                        </button>
                    </div>
                )}
            </div>
        </DropdownMenuItem>
    );

    return (
        <header className="bg-background/80 backdrop-blur-xl border-b border-border z-10 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 shadow-sm">
            <div className="flex items-center gap-3 md:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="text-muted-foreground hover:text-foreground rounded-xl"
                    aria-label="Toggle Sidebar"
                >
                    <APP_ICONS.ACTIONS.MENU size={20} className="transition-transform duration-300 active:scale-95" />
                </Button>
                <div className="flex flex-col">
                    <h2 className="text-base md:text-lg font-black text-foreground tracking-tight">النظام المحاسبي</h2>
                    <span className="text-[8px] md:text-[9px] text-primary font-bold uppercase tracking-wider leading-none">Advanced ERP System</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end mr-3 border-r border-border pr-4">
                    <span className="text-sm font-bold text-foreground">{loading ? 'جاري التحميل...' : user?.name}</span>
                    <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-500/20"></span>
                        {getRoleLabel(user?.role)}
                    </span>
                </div>

                {/* Operations Dropdown */}
                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "relative h-10 w-10 rounded-xl border transition-all shadow-sm group",
                                unreadOpCount > 0
                                    ? "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100"
                                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <APP_ICONS.SHARED.BELL size={20} className={cn(unreadOpCount > 0 && 'animate-pulse', 'group-hover:scale-110')} />
                            <span className={cn(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-sm",
                                unreadOpCount > 0 ? "bg-blue-600 text-white ring-2 ring-blue-500/20" : "bg-muted-foreground/30 text-foreground"
                            )}>
                                {unreadOpCount}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-2 rounded-2xl shadow-2xl border-border scrollbar-hide" align="end">
                        <div className="flex items-center justify-between p-3">
                            <DropdownMenuLabel className="font-black flex items-center gap-2 text-muted-foreground p-0">
                                <APP_ICONS.SHARED.BELL size={16} />
                                إشعارات العمليات
                            </DropdownMenuLabel>
                            {unreadOpCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">
                                    تحديد الكل كمقروء
                                </button>
                            )}
                        </div>
                        <DropdownMenuSeparator />
                        <div className="max-h-[300px] overflow-y-auto">
                            {opNotifications.length > 0 ? (
                                opNotifications.map(renderNotificationItem)
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground/50">
                                    <APP_ICONS.STATE.SUCCESS size={28} className="text-emerald-400" />
                                    <p className="text-xs font-bold">لا توجد إشعارات</p>
                                </div>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Tasks Dropdown */}
                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "relative h-10 w-10 rounded-xl border transition-all shadow-sm group",
                                unreadTaskCount > 0
                                    ? "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
                                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <APP_ICONS.SHARED.TASKS size={20} className={cn(unreadTaskCount > 0 && 'animate-bounce', 'group-hover:scale-110')} />
                            <span className={cn(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white shadow-sm",
                                unreadTaskCount > 0 ? "bg-rose-600 text-white ring-2 ring-rose-500/20" : "bg-muted-foreground/30 text-foreground"
                            )}>
                                {unreadTaskCount}
                            </span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 p-2 rounded-2xl shadow-2xl border-rose-100 shadow-rose-900/10" align="end">
                        <div className="flex items-center justify-between p-3">
                            <DropdownMenuLabel className="font-black flex items-center gap-2 text-rose-800 p-0">
                                <APP_ICONS.SHARED.TASKS size={16} />
                                مهام معلقة
                            </DropdownMenuLabel>
                        </div>
                        <DropdownMenuSeparator className="bg-rose-100/50" />
                        <div className="max-h-[300px] overflow-y-auto">
                            {isBackupOverdue && (
                                <DropdownMenuItem asChild className="p-0 focus:bg-transparent cursor-pointer mb-2">
                                    <Link href="/settings#backup-section" className="flex items-start gap-4 p-3 mx-1 rounded-xl hover:bg-rose-50/50 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                                            <APP_ICONS.MODULES.DATABASE size={18} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-rose-900 leading-tight">حان موعد النسخ الاحتياطي!</p>
                                            <p className="text-[11px] font-bold text-rose-600/70 leading-relaxed">يرجى إجراء نسخة احتياطية لحماية البيانات. الموعد كان: {new Date(systemConfig.nextBackupAt).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            {taskNotifications.length > 0 ? (
                                taskNotifications.map(renderNotificationItem)
                            ) : (
                                !isBackupOverdue && (
                                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground/50">
                                        <APP_ICONS.STATE.SUCCESS size={28} className="text-emerald-400" />
                                        <p className="text-xs font-bold">كل المهام منجزة!</p>
                                    </div>
                                )
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-1 focus-visible:ring-blue-500 p-0">
                            <Avatar className="h-10 w-10 border-2 border-border shadow-sm transition-transform hover:scale-105 duration-200">
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
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.username || 'user@example.com'}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/profile">
                                <APP_ICONS.ACTIONS.PROFILE className="mr-2 ml-2 h-4 w-4 text-muted-foreground/80" />
                                <span>الملف الشخصي</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/user-settings">
                                <APP_ICONS.MODULES.GENERAL_SETTINGS className="mr-2 ml-2 h-4 w-4 text-muted-foreground/80" />
                                <span>إعدادات المستخدم</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600">
                            <Link href="/logout">
                                <APP_ICONS.NAV.LOGOUT className="mr-2 ml-2 h-4 w-4" />
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
