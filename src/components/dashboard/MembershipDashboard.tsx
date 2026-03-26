"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { APP_ICONS } from '@/lib/icons';
import { cn, formatDashboardNumber } from '@/lib/utils';
import { IconBox } from '@/components/ui/IconBox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/badge';
import { CountUp } from '@/components/ui/CountUp';

import { SubscriptionTrendChart, FinancialTrendChart, ExpensePieChart } from './DashboardCharts';

interface MembershipDashboardProps {
    data: any;
    loading?: boolean;
    variant?: 'summary' | 'full';
}

const MetricCard = ({ icon, title, value, description, className, iconClassName, breakdown, breakdownLabel }: {
    icon: any, title: string, value: string | number, description: string, className?: string, iconClassName?: string, breakdown?: any[], breakdownLabel?: string
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    return (
        <Card className={cn("relative overflow-hidden group shadow-sm bg-card border-border rounded-[2rem] transition-all duration-300", className, isExpanded ? "row-span-2 h-fit" : "")}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <IconBox icon={icon} className={cn("shadow-lg", iconClassName)} boxSize="w-11 h-11" iconSize={20} />
                        <div>
                            <h3 className="font-black text-foreground text-sm">{title}</h3>
                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">{description}</p>
                        </div>
                    </div>
                    {breakdown && breakdown.length > 0 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-all text-muted-foreground/40 hover:text-foreground group/btn"
                        >
                            <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
                                <APP_ICONS.ACTIONS.CHEVRON_DOWN size={14} />
                            </div>
                        </button>
                    )}
                </div>
                <div className="mt-6 text-3xl font-black text-foreground border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col items-start text-right">
                    <CountUp end={value} />
                </div>

                {breakdown && breakdown.length > 0 && isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {breakdown.map((item, idx) => (
                            <div key={item.entityName || idx} className="flex flex-row-reverse justify-between items-center text-[12px] font-bold py-1">
                                <span className="text-foreground/90 text-right min-w-[80px]">
                                    {formatDashboardNumber(item[breakdownLabel || 'total'] || 0, 0)}
                                </span>
                                <span className="text-muted-foreground/80 flex items-center gap-1.5 text-[11px] overflow-hidden">
                                     <div className={cn("w-1 h-3 rounded-full shrink-0", iconClassName?.split(' ')[0])}></div>
                                     <span className="truncate">{item.entityName}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export function MembershipDashboard({ data, loading, variant = 'full' }: MembershipDashboardProps) {
    const router = useRouter();

    if (loading) {
        return (
            <div className="relative min-h-[200px] w-full flex items-center justify-center p-12 bg-card/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-border/60">
                <div className="flex flex-col items-center gap-4">
                    <APP_ICONS.STATE.LOADING className="animate-spin text-indigo-600" size={32} />
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest animate-pulse">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    if (variant === 'summary') {
        const stats = data?.membershipStats;
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={APP_ICONS.MODULES.ENTITIES}
                    title="إجمالي الأعضاء"
                    value={stats?.totalMembers || 0}
                    description="Total Members"
                    iconClassName="bg-blue-600 text-white"
                    breakdown={stats?.breakdown}
                    breakdownLabel="total"
                />
                <MetricCard
                    icon={APP_ICONS.ACTIONS.ACTIVITY}
                    title="الأعضاء النشطين"
                    value={stats?.activeMembers || 0}
                    description="Active Members"
                    iconClassName="bg-emerald-600 text-white"
                    breakdown={stats?.breakdown}
                    breakdownLabel="active"
                />
                <MetricCard
                    icon={APP_ICONS.ACTIONS.SHIELD_ALERT}
                    title="المطالبين بالسداد"
                    value={stats?.membersDue || 0}
                    description="Due for Payment"
                    iconClassName="bg-rose-600 text-white"
                    breakdown={stats?.breakdown}
                    breakdownLabel="due"
                />
                <MetricCard
                    icon={APP_ICONS.MODULES.COLLECT}
                    title="الأعضاء المسددون"
                    value={stats?.totalSubscribers || 0}
                    description="Paid Members"
                    iconClassName="bg-indigo-600 text-white"
                    breakdown={stats?.totalSubscribersBreakdown}
                    breakdownLabel="total"
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ─── Members Insights ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-sm border-border rounded-[2.5rem] bg-card overflow-hidden">
                    <CardHeader className="p-8 pb-0">
                        <PageHeader
                            icon={APP_ICONS.ACTIONS.ACTIVITY}
                            title={`تحصيل الاشتراكات لعام ${data?.selectedYear}`}
                            description="مبالغ الاشتراكات المحصلة شهرياً خلال العام المختار"
                            iconClassName="bg-indigo-600 shadow-indigo-200"
                            iconSize={18}
                            variant="simple"
                        />
                    </CardHeader>
                    <CardContent className="p-8">
                        <SubscriptionTrendChart data={data?.membershipStats?.monthlySubscriptions || []} />
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-border rounded-[2.5rem] bg-card flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                    {/* Decorative circle */}
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 mb-6 shadow-xl shadow-emerald-200/20 dark:shadow-none">
                            <APP_ICONS.ACTIONS.ACTIVITY size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2">نسبة النشاط</h3>
                        <p className="text-xs text-slate-400 font-bold mb-6 uppercase tracking-widest">Active Members Ratio</p>

                        <div className="text-6xl font-black text-emerald-600 dark:text-emerald-400 mb-2 flex flex-col items-start text-right">
                            <div className="flex items-baseline gap-1">
                                <CountUp 
                                    end={Math.round(((data?.membershipStats?.activeMembers || 0) / (data?.membershipStats?.totalMembers || 1)) * 100)} 
                                />%
                            </div>
                        </div>
                        <Badge variant="secondary" className="font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none">
                            {formatDashboardNumber(data?.membershipStats?.activeMembers || 0, 0)} من أصل {formatDashboardNumber(data?.membershipStats?.totalMembers || 0, 0)}
                        </Badge>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-sm border-border rounded-[2.5rem] overflow-hidden flex flex-col bg-card">
                    <CardHeader className="border-b border-border bg-muted/30 p-8">
                        <PageHeader
                            icon={APP_ICONS.ACTIONS.CALENDAR}
                            title="إجمالي الاشتراكات المحصلة"
                            description="مقارنة بين السنوات الأخيرة (مبالغ)"
                            iconClassName="bg-card text-muted-foreground/80 shadow-sm"
                            iconSize={16}
                            variant="simple"
                        />
                    </CardHeader>
                    <CardContent className="p-8 flex-1">
                        <div className="space-y-4">
                            {data?.membershipStats?.subscriptionsByYear?.length > 0 ? (
                                data.membershipStats.subscriptionsByYear.map((item: any) => (
                                    <div
                                        key={item.year}
                                        className="flex items-center justify-between p-5 bg-muted/40 rounded-3xl border border-border cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all active:scale-[0.98] group"
                                        onClick={() => router.push(`/subscriptions/members?year=${item.year}&paid=true`)}
                                    >
                                        <div className="flex flex-row-reverse justify-between items-center w-full">
                                            <div className="flex flex-col items-start min-w-[100px] uppercase text-right">
                                                <div className="font-black text-xl text-slate-900 dark:text-slate-100 border-b-2">
                                                    {formatDashboardNumber(item.amountBase || 0)} <span className="text-[12px] text-slate-400 font-bold">{data?.baseCurrencySymbol}</span>
                                                </div>
                                                <div className="flex flex-col items-start gap-0.5 mt-0.5 ">
                                                    {(item.currencies || []).map((curr: any) => (
                                                        <div key={curr.code} className="text-[14px] font-bold text-foreground/40 tabular-nums leading-none">
                                                            {formatDashboardNumber(curr.amount || 0)} {curr.symbol || curr.code}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="text-[12px] font-black text-indigo-600/80 mt-1 tracking-tighter bg-indigo-50/50 dark:bg-indigo-900/20  py-0.5 rounded-full px-2">
                                                    المسددين: {formatDashboardNumber(item.memberCount || 0, 0)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex flex-col items-center justify-center font-black transition-colors group-hover:bg-indigo-600 group-hover:text-white shrink-0">
                                                    {item.year}
                                                </div>
                                                <span className="font-black text-slate-700 dark:text-slate-300 truncate">اشتراكات عام {item.year}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground/60 font-medium">لا توجد بيانات اشتراكات محصلة بعد</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-border rounded-[2.5rem] overflow-hidden flex flex-col bg-card">
                    <CardHeader className="border-b border-border bg-muted/30 p-8">
                        <PageHeader
                            icon={APP_ICONS.MODULES.JOURNAL}
                            title="الأعضاء المطالبين بالسداد"
                            description="عدد الأعضاء غير المسددين حسب السنة"
                            iconClassName="bg-card text-muted-foreground/80 shadow-sm"
                            iconSize={16}
                            variant="simple"
                        />
                    </CardHeader>
                    <CardContent className="p-8 flex-1">
                        <div className="space-y-4 text-sm">
                            {data?.membershipStats?.pendingPaymentsByYear?.slice(0, 5).map((item: any) => (
                                <div
                                    key={item.year}
                                    className="flex items-center justify-between p-5 bg-rose-500/5 dark:bg-rose-500/10 rounded-3xl border border-rose-500/10 cursor-pointer hover:bg-rose-500/10 dark:hover:bg-rose-500/20 hover:shadow-xl transition-all active:scale-[0.98] group"
                                    onClick={() => router.push(`/subscriptions/members?year=${item.year}&due=true`)}
                                >
                                    <div className="flex flex-row-reverse justify-between items-center w-full">
                                        <div className="font-black text-xl text-rose-600 flex flex-col items-start uppercase text-right min-w-[60px]">
                                            {formatDashboardNumber(item.pending || 0, 0)} <span className="text-[12px] text-rose-400 font-bold tracking-tighter">لم يسددوا</span>
                                        </div>
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center font-black group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0">
                                                {item.year}
                                            </div>
                                            <div className="flex flex-col text-right truncate">
                                                <span className="font-black text-slate-700 dark:text-slate-300 truncate">متأخرات عام {item.year}</span>
                                                <span className="text-[12px] text-slate-400 font-bold truncate leading-none mt-1">إجمالي المطالبين: {formatDashboardNumber(item.expected || 0, 0)} | سدد: {formatDashboardNumber(item.paid || 0, 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
