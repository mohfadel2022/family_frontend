"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { APP_ICONS } from "@/lib/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { HeartHandshake } from "lucide-react";

import { 
    MAIN_MENU as mainItems, 
    VOUCHERS_MENU as vouchersItems, 
    SUBSCRIPTION_MENU as subscriptionItems, 
    ACCOUNTS_MENU as accountsItems, 
    REPORTS_MENU as reportsItems, 
    SETTINGS_MENU as settingsItems 
} from "@/lib/nav";

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
                    : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-foreground"
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
                <span className="font-semibold text-sm tracking-tight truncate text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">{title}</span>
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
    title, icon: Icon, items, isOpen: sidebarOpen, isExpanded, onToggle
}: { title: string; icon: any; items: any[]; isOpen: boolean; isExpanded: boolean; onToggle: () => void }) => {
    const pathname = usePathname();
    const isAnyActive = items.some(i => pathname === i.href || (i.href !== '/' && pathname.startsWith(i.href)));
    const { isMobile, setIsOpen } = useSidebar();

    if (!sidebarOpen) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <button
                        onClick={onToggle}
                        className={cn(
                            "flex items-center justify-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
                            isAnyActive ? "bg-blue-600/15 text-blue-400" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                        )}
                    >
                        <Icon size={17} className="shrink-0 group-hover:scale-110 transition-all duration-300 mx-auto" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-bold border-sidebar-border bg-sidebar text-sidebar-foreground p-0 overflow-hidden min-w-[160px]">
                    <div className="px-3 py-2 border-b border-sidebar-border/50 text-xs uppercase tracking-wider text-sidebar-foreground/50">{title}</div>
                    {items.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => { if (isMobile) setIsOpen(false); }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                                pathname === item.href ? "text-blue-400" : "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
                onClick={onToggle}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    isAnyActive
                        ? "bg-blue-600/10 text-blue-400"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/70 hover:text-sidebar-foreground"
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
                <APP_ICONS.ACTIONS.CHEVRON_DOWN
                    size={14}
                    className={cn(
                        "shrink-0 transition-transform duration-300",
                        isExpanded ? "rotate-0" : "-rotate-90",
                        isAnyActive ? "text-blue-400" : "text-sidebar-foreground/80"
                    )}
                />
            </button>

            {isExpanded && (
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
                                        : "text-sidebar-foreground/80 hover:bg-slate-800/40 hover:text-sidebar-foreground"
                                )}
                            >
                                {isActive && <div className="absolute inset-y-1.5 right-0 w-0.5 bg-blue-500 rounded-full" />}
                                {item.icon ? (
                                    <item.icon
                                        size={14}
                                        className={cn(
                                            "shrink-0 transition-transform duration-200 group-hover:scale-110",
                                            isActive ? "text-blue-400" : "group-hover:text-blue-400"
                                        )}
                                    />
                                ) : (
                                    <div className="w-3.5 h-3.5" /> // Spacer if no icon
                                )}
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
    const pathname = usePathname();
    const { isOpen, setIsOpen, isMobile } = useSidebar();
    const { isAdmin, checkPermission } = useAuth();
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    const filterByPermission = (items: any[]) => {
        return items.filter(item => {
            if (isAdmin) return true;
            if (!item.permission) return true;
            return checkPermission(item.permission);
        });
    };

    // Define visible items
    const visibleMainItems = filterByPermission(mainItems);
    const visibleVoucherItems = filterByPermission(vouchersItems);
    const visibleSubscriptionItems = filterByPermission(subscriptionItems);
    const visibleAccountsItems = filterByPermission(accountsItems);
    const visibleReportsItems = filterByPermission(reportsItems);
    const visibleSettingsItems = filterByPermission(settingsItems);

    // Auto-expand on navigation
    React.useEffect(() => {
        const groups = [
            { title: "السندات والقيود", items: visibleVoucherItems },
            { title: "الاشتراكات والتحصيل", items: visibleSubscriptionItems },
            { title: "التقارير", items: visibleReportsItems },
            { title: "الإعدادات", items: visibleSettingsItems },
        ];

        const activeGroup = groups.find(g => 
            g.items.some(i => pathname === i.href || (i.href !== '/' && pathname.startsWith(i.href)))
        );

        if (activeGroup) {
            setOpenGroup(activeGroup.title);
        }
    }, [pathname]);

    const toggleGroup = (title: string) => {
        setOpenGroup(prev => prev === title ? null : title);
    };

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/50 mb-4 h-20">
                <div className="flex items-center gap-3 w-full pl-2">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/10 overflow-hidden p-1.5 border border-slate-700/30">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-handshake-icon lucide-heart-handshake"><path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"/></svg>
                    </div>
                    {isOpen && (
                        <div className="flex flex-col animate-in fade-in duration-300">
                            <h1 className="text-lg font-black bg-white bg-clip-text text-transparent truncate tracking-tight">
                                صندوق العائلة
                            </h1>
                            <span className="text-[10px] text-sidebar-foreground/40 font-bold uppercase tracking-[0.15em] leading-none">
                                Family Treasury
                            </span>
                        </div>
                    )}
                </div>
                {isMobile && isOpen && (
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-muted-foreground/60">
                        <APP_ICONS.ACTIONS.X size={20} />
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                {/* Main items */}
                {visibleMainItems.map(item => (
                    <NavItem key={item.href} {...item} isOpen={isOpen} />
                ))}

                {/* Vouchers dynamic group */}
                {visibleVoucherItems.length > 0 && (
                    <NavGroup
                        title="السندات والقيود"
                        icon={APP_ICONS.NAV.VOUCHERS}
                        items={visibleVoucherItems}
                        isOpen={isOpen}
                        isExpanded={openGroup === "السندات والقيود"}
                        onToggle={() => toggleGroup("السندات والقيود")}
                    />
                )}

                {/* Subscription items */}
                {visibleSubscriptionItems.length > 0 && (
                    <NavGroup
                        title="الاشتراكات والتحصيل"
                        icon={APP_ICONS.NAV.SUBSCRIPTIONS}
                        items={visibleSubscriptionItems}
                        isOpen={isOpen}
                        isExpanded={openGroup === "الاشتراكات والتحصيل"}
                        onToggle={() => toggleGroup("الاشتراكات والتحصيل")}
                    />
                )}

                {/* Accounts items */}
                {visibleAccountsItems.map(item => (
                    <NavItem key={item.href} {...item} isOpen={isOpen} />
                ))}

                {/* Reports group */}
                {visibleReportsItems.length > 0 && (
                    <NavGroup
                        title="التقارير"
                        icon={APP_ICONS.REPORTS.MAIN}
                        items={visibleReportsItems}
                        isOpen={isOpen}
                        isExpanded={openGroup === "التقارير"}
                        onToggle={() => toggleGroup("التقارير")}
                    />
                )}


                {/* Divider */}
                <div className="my-3 border-t border-slate-800/40" />

                {/* Settings group */}
                {visibleSettingsItems.length > 0 && (
                    <NavGroup
                        title="الإعدادات"
                        icon={APP_ICONS.NAV.SETTINGS}
                        items={visibleSettingsItems}
                        isOpen={isOpen}
                        isExpanded={openGroup === "الإعدادات"}
                        onToggle={() => toggleGroup("الإعدادات")}
                    />
                )}
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
                                <APP_ICONS.NAV.LOGOUT size={17} className="mx-auto group-hover:-translate-x-1 transition-transform duration-300" />
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
                        <APP_ICONS.NAV.LOGOUT size={17} className="shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
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
                        "fixed inset-y-0 right-0 w-72 bg-sidebar text-sidebar-foreground z-50 transform transition-transform duration-300 ease-in-out border-l border-sidebar-border shadow-2xl flex flex-col",
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
                "bg-sidebar text-sidebar-foreground h-screen transition-all duration-300 ease-in-out flex flex-col sticky top-0 border-l border-sidebar-border shadow-2xl z-20 shrink-0",
                isOpen ? "w-64" : "w-20"
            )}
        >
            {sidebarContent}
        </aside>
    );
};

export default Sidebar;
