"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    FileText,
    Receipt,
    PieChart,
    History as HistoryIcon,
    Shield,
    Settings,
    LogOutIcon,
    FilePlus2,
    X,
    ChevronDown,
    Library,
    Coins,
    Building2,
    AlertTriangle,
    UserCheck,
    Wallet,
    Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// ─── Menu structure ───────────────────────────────────────────────────────────
const mainItems = [
    { title: "لوحة التحكم", icon: LayoutDashboard, href: "/" },
];

const vouchersItems = [
    { title: "قيود اليومية", icon: Receipt, href: "/vouchers/journal" },
    { title: "سندات القبض", icon: FilePlus2, href: "/vouchers/receipts" },
    { title: "سندات الصرف", icon: FilePlus2, href: "/vouchers/payments" },
];

const subscriptionItems = [
    { title: "إدارة الجهات", icon: Building2, href: "/subscriptions/entities" },
    { title: "إدارة الأعضاء", icon: UserCheck, href: "/subscriptions/members" },
    { title: "تحصيل الاشتراكات", icon: Wallet, href: "/subscriptions/collect" },
    { title: "سجلات التحصيل", icon: HistoryIcon, href: "/subscriptions/collect/history" },
];

const analyticItems = [
    { title: "شجرة الحسابات", icon: Library, href: "/accounts" },
    { title: "التقارير المالية", icon: PieChart, href: "/reports" },
];

const settingsItems = [
    { title: "الإعدادات العامة", icon: Settings, href: "/settings" },
    { title: "إدارة المستخدمين", icon: Users, href: "/settings/users" },
    { title: "إغلاق الفترات", icon: HistoryIcon, href: "/settings/periods" },
    { title: "سجل العمليات", icon: Shield, href: "/settings/audit-logs" },
];

// ─── NavItem ─────────────────────────────────────────────────────────────────
const NavItem = ({
    title, icon: Icon, href, isOpen: sidebarOpen
}: { title: string; icon: any; href: string; isOpen: boolean }) => {
    const pathname = usePathname();
    const { isMobile, setIsOpen } = useSidebar();
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

    const content = (
        <Link
            href={href}
            onClick={() => { if (isMobile) setIsOpen(false); }}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-blue-600/15 text-blue-400"
                    : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100"
            )}
        >
            {isActive && <div className="absolute inset-y-1 right-0 w-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.6)]" />}
            <Icon
                size={17}
                className={cn(
                    "shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-blue-400" : "group-hover:text-blue-400",
                    !sidebarOpen && "mx-auto"
                )}
            />
            {sidebarOpen && (
                <span className="font-semibold text-sm tracking-tight truncate">{title}</span>
            )}
        </Link>
    );

    if (!sidebarOpen) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild><div>{content}</div></TooltipTrigger>
                <TooltipContent side="left" className="font-bold border-slate-800 bg-slate-900 text-slate-100">
                    {title}
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
};

// ─── NavGroup ─────────────────────────────────────────────────────────────
const NavGroup = ({
    title, icon: Icon, items, isOpen: sidebarOpen
}: { title: string; icon: any; items: any[]; isOpen: boolean }) => {
    const pathname = usePathname();
    const isAnyActive = items.some(i => pathname === i.href || (i.href !== '/' && pathname.startsWith(i.href)));
    const [expanded, setExpanded] = useState(isAnyActive);
    const { isMobile, setIsOpen } = useSidebar();

    // Reset expanded state if any item becomes active (e.g. via direct navigation)
    React.useEffect(() => {
        if (isAnyActive) setExpanded(true);
    }, [pathname, isAnyActive]);

    if (!sidebarOpen) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={cn(
                            "flex items-center justify-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
                            isAnyActive ? "bg-blue-600/15 text-blue-400" : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100"
                        )}
                    >
                        <Icon size={17} className="shrink-0 group-hover:scale-110 transition-all duration-300 mx-auto" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-bold border-slate-800 bg-slate-900 text-slate-100 p-0 overflow-hidden min-w-[160px]">
                    <div className="px-3 py-2 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">{title}</div>
                    {items.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => { if (isMobile) setIsOpen(false); }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                                pathname === item.href ? "text-blue-400" : "text-slate-300 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <item.icon size={14} />
                            {item.title}
                        </Link>
                    ))}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <div>
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isAnyActive
                        ? "bg-blue-600/10 text-blue-400"
                        : "hover:bg-slate-800/50 text-slate-400 hover:text-slate-100"
                )}
            >
                <Icon
                    size={17}
                    className={cn(
                        "shrink-0 transition-all duration-300",
                        isAnyActive ? "text-blue-400" : "group-hover:text-blue-400"
                    )}
                />
                <span className="font-semibold text-sm tracking-tight flex-1 text-right">{title}</span>
                <ChevronDown
                    size={14}
                    className={cn(
                        "shrink-0 transition-transform duration-300",
                        expanded ? "rotate-0" : "-rotate-90",
                        isAnyActive ? "text-blue-400" : "text-slate-500"
                    )}
                />
            </button>

            {expanded && (
                <div className="mt-1 mr-4 border-r border-slate-700/60 pr-2 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    {items.map(item => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => { if (isMobile) setIsOpen(false); }}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group relative text-[13px]",
                                    isActive
                                        ? "bg-blue-600/15 text-blue-400 font-semibold"
                                        : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-200"
                                )}
                            >
                                {isActive && <div className="absolute inset-y-1.5 right-0 w-0.5 bg-blue-500 rounded-full" />}
                                <item.icon
                                    size={14}
                                    className={cn(
                                        "shrink-0 transition-transform duration-200 group-hover:scale-110",
                                        isActive ? "text-blue-400" : "group-hover:text-blue-400"
                                    )}
                                />
                                <span className="truncate">{item.title}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Settings Group ───────────────────────────────────────────────────────────


// ─── Sidebar ──────────────────────────────────────────────────────────────────
const Sidebar = () => {
    const { isOpen, setIsOpen, isMobile } = useSidebar();

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/50 mb-4 h-20">
                <div className="flex items-center gap-3 w-full pl-2">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
                        ص
                    </div>
                    {isOpen && (
                        <div className="flex flex-col animate-in fade-in duration-300">
                            <h1 className="text-lg font-black bg-gradient-to-l from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent truncate tracking-tight">
                                صندوق العائلة
                            </h1>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] leading-none">
                                Family Treasury
                            </span>
                        </div>
                    )}
                </div>
                {isMobile && isOpen && (
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-slate-400">
                        <X size={20} />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {/* Main items */}
                {mainItems.map(item => (
                    <NavItem key={item.href} {...item} isOpen={isOpen} />
                ))}

                {/* Vouchers dynamic group */}
                <NavGroup
                    title="السندات والقيود"
                    icon={FileText}
                    items={vouchersItems}
                    isOpen={isOpen}
                />

                {/* Subscription items */}
                <NavGroup
                    title="الاشتراكات والتحصيل"
                    icon={UserCheck}
                    items={subscriptionItems}
                    isOpen={isOpen}
                />

                {/* Analytic items */}
                {analyticItems.map(item => (
                    <NavItem key={item.href} {...item} isOpen={isOpen} />
                ))}

                {/* Divider */}
                <div className="my-3 border-t border-slate-800/40" />

                {/* Settings group */}
                <NavGroup
                    title="الإعدادات"
                    icon={Settings}
                    items={settingsItems}
                    isOpen={isOpen}
                />
            </nav>

            {/* Footer: Logout */}
            <div className="p-3 border-t border-slate-800/50 mt-auto">
                {!isOpen ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Link
                                href="/logout"
                                className="flex items-center justify-center p-3 rounded-xl text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                            >
                                <LogOutIcon size={17} className="mx-auto group-hover:-translate-x-1 transition-transform duration-300" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="font-bold border-slate-800 bg-slate-900 text-slate-100">
                            تسجيل الخروج
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <Link
                        href="/logout"
                        className="flex items-center gap-3 p-3 rounded-xl text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                    >
                        <LogOutIcon size={17} className="shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
                        <span className="font-semibold text-sm">تسجيل الخروج</span>
                    </Link>
                )}
            </div>
        </>
    );

    if (isMobile) {
        return (
            <>
                {isOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />
                )}
                <aside
                    className={cn(
                        "fixed inset-y-0 right-0 w-72 bg-[#0f172a] text-slate-300 z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-800/50 shadow-2xl flex flex-col",
                        isOpen ? "translate-x-0" : "translate-x-full"
                    )}
                >
                    {sidebarContent}
                </aside>
            </>
        );
    }

    return (
        <aside
            className={cn(
                "bg-[#0f172a] text-slate-300 h-screen transition-all duration-300 ease-in-out flex flex-col sticky top-0 border-l border-slate-800/50 shadow-2xl z-20 shrink-0",
                isOpen ? "w-64" : "w-20"
            )}
        >
            {sidebarContent}
        </aside>
    );
};

export default Sidebar;
