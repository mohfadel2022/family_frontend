"use client";

import React, { useEffect, useState } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { PageHeader } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE as API_URL, getAuthHeader, SUB_BASE } from '@/lib/api';
import { MembershipDashboard } from '@/components/dashboard/MembershipDashboard';
import { FinancialDashboard } from '@/components/dashboard/FinancialDashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { IconBox } from '@/components/ui/IconBox';
import { useAuth } from '@/context/AuthContext';
import { CountUp } from '@/components/ui/CountUp';
import { Card, CardContent } from "@/components/ui/card";
import { usePageTheme } from '@/hooks/usePageTheme';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const API_BASE = API_URL;

const MetricCard = ({ icon, title, value, description, className, iconClassName }: {
    icon: any, title: string, value: string | number, description: string, className?: string, iconClassName?: string
}) => (
    <Card className={cn("relative overflow-hidden group shadow-sm bg-card border-border rounded-[2rem]", className)}>
        <CardContent className="p-6">
            <div className="flex items-center gap-4">
                <IconBox icon={icon} className={cn("shadow-lg", iconClassName)} boxSize="w-11 h-11" iconSize={20} />
                <div>
                    <h3 className="font-black text-foreground text-sm">{title}</h3>
                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">{description}</p>
                </div>
            </div>
            <div className="mt-6 text-3xl font-black text-foreground border-t border-slate-100 dark:border-slate-800 pt-4 font-mono">
                <CountUp end={value} />
            </div>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const { user } = useAuth();
    const theme = usePageTheme();
    const isAdmin = user?.role === 'ADMIN';
    const [selectedYear, setSelectedYear] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('dashboard_year');
            return saved ? parseInt(saved) : new Date().getFullYear();
        }
        return new Date().getFullYear();
    });
    const [activeTab, setActiveTab] = useState<'summary' | 'financials' | 'membership'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('dashboard_tab') as any) || 'summary';
        }
        return 'summary';
    });
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('dashboard_year', selectedYear.toString());
            localStorage.setItem('dashboard_tab', activeTab);
        }
    }, [selectedYear, activeTab]);

    useEffect(() => {
        fetchDashboard();
    }, [selectedYear]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                year: selectedYear.toString(),
            });
            const res = await axios.get(`${API_BASE}/dashboard?${params.toString()}`, getAuthHeader());
            setDashboardData(res.data);
        } catch (err) {
            console.error('Error fetching dashboard:', err);
            toast.error('فشل في تحميل بيانات لوحة التحكم');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !dashboardData) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header with Filtering */}
                 <PageHeader
                    icon={APP_ICONS.MODULES.DASHBOARD}
                    title="لوحة التحكم"
                    description="متابعة الأداء المالي والاشتراكات لجميع القطاعات"
                    iconClassName="bg-blue-600 shadow-blue-200"
                    iconSize={18}
                    
                >
                <div className="flex flex-wrap items-center gap-3">
                    {/* Year Selector Dropdown */}
                    <div className="flex items-center gap-2 bg-accent/50 p-1.5 rounded-2xl border border-border">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest px-2">السنة المالية</span>
                        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                            <SelectTrigger className="w-[120px] h-9 bg-transparent border-0 font-bold focus:ring-0">
                                <SelectValue placeholder="اختر السنة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {yearOptions.map(year => (
                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </PageHeader>
           

            {/* Content Tabs */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 p-1.5 bg-accent/30 w-fit rounded-[1.25rem] border border-border">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2",
                            activeTab === 'summary' ? cn("bg-card shadow-sm border border-border/50", theme.accent) : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <APP_ICONS.ACTIONS.LIST size={16} />
                        الملخص العام
                    </button>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2",
                            activeTab === 'financials' ? cn("bg-card shadow-sm border border-border/50", theme.accent) : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <APP_ICONS.MODULES.JOURNAL size={16} />
                        الأداء المالي
                    </button>
                    <button
                        onClick={() => setActiveTab('membership')}
                        className={cn(
                            "px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2",
                            activeTab === 'membership' ? cn("bg-card shadow-sm border border-border/50", theme.accent) : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <APP_ICONS.MODULES.ENTITIES size={16} />
                        الاشتراكات
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'summary' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <CollapsibleSection 
                                title="نظرة عامة على الاشتراكات" 
                                icon={APP_ICONS.MODULES.ENTITIES}
                                defaultOpen={true}
                                accentColor="bg-blue-600"
                            >
                                <MembershipDashboard data={dashboardData} loading={loading} variant="summary" />
                            </CollapsibleSection>

                            <CollapsibleSection 
                                title="نظرة عامة على الأداء المالي" 
                                icon={APP_ICONS.MODULES.JOURNAL}
                                defaultOpen={true}
                                accentColor="bg-emerald-600"
                            >
                                <FinancialDashboard data={dashboardData} loading={loading} variant="summary" />
                            </CollapsibleSection>
                        </div>
                    )}

                    {activeTab === 'financials' && (
                        <FinancialDashboard data={dashboardData} loading={loading} variant="full" />
                    )}

                    {activeTab === 'membership' && (
                        <MembershipDashboard data={dashboardData} loading={loading} variant="full" />
                    )}
                </div>
            </div>
        </div>
    );
};
const CollapsibleSection = ({ title, icon, children, defaultOpen = true, accentColor }: any) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-card/30 rounded-[2.5rem] border border-border/50 overflow-hidden transition-all duration-500">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/10", accentColor || "bg-blue-600")}>
                        {React.createElement(icon, { size: 18 })}
                    </div>
                    <h3 className="text-lg font-black text-foreground">{title}</h3>
                </div>
                <div className={cn("transition-transform duration-300", isOpen ? "rotate-180" : "")}>
                    <APP_ICONS.ACTIONS.CHEVRON_DOWN size={20} className="text-muted-foreground" />
                </div>
            </button>
            <div className={cn("transition-all duration-500 ease-in-out px-6 overflow-hidden", isOpen ? "max-h-[2000px] pb-8 opacity-100" : "max-h-0 opacity-0")}>
                {children}
            </div>
        </div>
    );
};

export default Dashboard;
