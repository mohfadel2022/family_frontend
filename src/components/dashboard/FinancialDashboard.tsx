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

// ─── Entity Breakdown List ──────────────────────────────────────────────
const BreakdownList = ({ items, symbol, loading, color, isDefaultExpanded = true }: { items: any[], symbol: string, loading?: boolean, color?: string, isDefaultExpanded?: boolean }) => {
    const [isExpanded, setIsExpanded] = React.useState(isDefaultExpanded);
    if (loading) return null;
    if (!items || items.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-border/50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors mb-2 group"
            >
                التفاصيل حسب الحساب
                <div className={cn("p-1 rounded-md bg-muted group-hover:bg-accent transition-all transform", isExpanded ? "rotate-180" : "")}>
                    <APP_ICONS.ACTIONS.CHEVRON_DOWN size={14} />
                </div>
            </button>

            {isExpanded && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {items.map((item, idx) => (
                        <div key={item.name || idx} className="flex flex-row-reverse justify-between items-center text-xs font-bold py-1">
                            <div className="flex flex-col items-start min-w-[110px] text-right">
                                <span className="text-foreground leading-none">
                                    {formatDashboardNumber(item.balance ?? item.total ?? 0)}
                                    <span className="text-[12px]  ml-0.5">{symbol}</span>
                                </span>
                                {item.symbol && item.symbol !== symbol && (
                                    <span className={cn("text-[12px] text-muted-foreground/40 mt-1 whitespace-nowrap", `text-${color}`)}>
                                        ({formatDashboardNumber(item.originalBalance ?? item.originalTotal ?? 0)} {item.symbol})
                                    </span>
                                )}
                            </div>
                            <span className="text-muted-foreground/80 flex items-center justify-end gap-1.5 leading-none overflow-hidden">
                                <div className={cn("w-1 h-4 rounded-full shrink-0", `bg-${color}` || "bg-blue-500")}></div>
                                <span className="truncate h-4">{item.name}</span>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Multi-Currency Card ────────────────────────────────────────────────
const CurrencyCard = ({
    title,
    subtitle,
    icon: Icon,
    color,
    gradientFrom,
    gradientTo,
    items,
    loading,
    emptyText,
    baseCurrencySymbol,
    baseCurrencyCode,
    breakdown
}: any) => (
    <Card className="relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500 border-border rounded-3xl bg-card">
        {loading && (
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex items-center justify-center">
                <APP_ICONS.STATE.LOADING className="animate-spin text-blue-600 dark:text-blue-500" size={24} />
            </div>
        )}

        {/* Decorative background */}
        <div className={cn("absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.07] transition-transform duration-700 group-hover:scale-[2]", `bg-gradient-to-br ${gradientFrom} ${gradientTo}`)}></div>
        <div className={cn("absolute -left-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.04]", `bg-gradient-to-br ${gradientFrom} ${gradientTo}`)}></div>

        <CardContent className="p-6 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <IconBox icon={Icon} className={cn("shadow-lg", color)} boxSize="w-11 h-11" iconSize={20} />
                    <div>
                        <h3 className="font-black text-foreground text-sm">{title}</h3>
                        <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">{subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Currency Items */}
            <div className="space-y-3">
                {items && items.length > 0 ? items.map((item: any, i: number) => (
                    <div
                        key={item.code}
                        className="flex items-center justify-between p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-all group/item border border-transparent hover:border-border"
                    >
                        <div className="flex flex-row-reverse justify-between items-center w-full">
                            <div className="flex flex-col items-start min-w-[120px] text-right">
                                <div className="flex items-center gap-1.5 leading-none">
                                    <span className="text-foreground text-base tabular-nums">
                                        {formatDashboardNumber(item.balanceBase ?? item.totalBase ?? 0, 0)}
                                    </span>
                                    <span className="text-[10px] font-bold text-muted-foreground/60">{baseCurrencySymbol}</span>
                                </div>
                                {item.code !== baseCurrencyCode && (
                                    <p className={`text-[10px] font-bold text-${color} mt-1 tabular-nums transition-all group-hover:text-muted-foreground/60`}>
                                        ({formatDashboardNumber(item.balance ?? item.total ?? 0, 0)} {item.symbol || item.code})
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black uppercase tracking-tighter shadow-sm transition-transform group-hover/item:scale-110",
                                    `bg-${color}`, "text-white"
                                )}>
                                    {item.code}
                                </div>
                                <span className="text-xs font-bold text-muted-foreground truncate">{item.symbol || item.code}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-6 text-muted-foreground font-medium text-xs bg-muted/30 rounded-2xl border border-dashed border-border">
                        {emptyText || 'لا توجد بيانات'}
                    </div>
                )}
            </div>

            {/* Account Breakdown */}
            {breakdown && breakdown.length > 0 && (
                <BreakdownList 
                    items={breakdown} 
                    symbol={baseCurrencySymbol} 
                    color={color} 
                    isDefaultExpanded={false}
                />
            )}
        </CardContent>
    </Card>
);

import { FinancialTrendChart, ExpensePieChart } from './DashboardCharts';

interface FinancialDashboardProps {
    data: any;
    loading: boolean;
    variant?: 'summary' | 'full';
}

export function FinancialDashboard({ data, loading, variant = 'full' }: FinancialDashboardProps) {
    const router = useRouter();

    const handleNavigate = (entry: any) => {
        let path = '/vouchers/journal';
        if (entry.type === 'RECEIPT') path = '/vouchers/receipts';
        if (entry.type === 'PAYMENT') path = '/vouchers/payments';
        router.push(`${path}?id=${entry.id}`);
    };

    if (variant === 'summary') {
        const getDualCurrency = (amount: number, currencyItems: any[]) => {
            if (!currencyItems || currencyItems.length === 0) return null;
            // If there's only one currency and it's not base (or if it's the only one even if base, but user wants parentheses if foreign)
            const foreignItems = currencyItems.filter(item => item.code !== data?.baseCurrencyCode);
            if (foreignItems.length === 1 && currencyItems.length === 1) {
                return ` (${formatDashboardNumber(foreignItems[0].total || foreignItems[0].balance || 0)})`;
            }
            return null;
        };

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="relative overflow-hidden group shadow-sm border-border rounded-3xl bg-card transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <IconBox icon={APP_ICONS.MODULES.COLLECT} className="bg-blue-600 text-white shadow-lg" boxSize="w-12 h-12" iconSize={24} />
                            <div>
                                <h3 className="font-black text-foreground text-sm">إجمالي السيولة</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Total Liquidity</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-slate-800 dark:text-slate-100 border-t border-border pt-4 flex flex-col items-start text-right">
                            <div className="flex items-baseline gap-2">
                                <CountUp end={data?.totalLiquidity || 0} />
                                <span className="text-sm text-slate-400 font-bold">{data?.baseCurrencySymbol}</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground/40 mt-1">
                                {getDualCurrency(data?.totalLiquidity, data?.assetsByCurrency)}
                            </span>
                        </div>
                        <BreakdownList items={data?.assetsBreakdown} symbol={data?.baseCurrencySymbol} color="blue-600" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group shadow-sm border-border rounded-3xl bg-card transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <IconBox icon={APP_ICONS.REPORTS.BRANCH_REVENUE} className="bg-emerald-600 text-white shadow-lg" boxSize="w-12 h-12" iconSize={24} />
                            <div>
                                <h3 className="font-black text-foreground text-sm">إيرادات {data?.selectedYear}</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Yearly Revenue</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500 border-t border-border pt-4 flex flex-col items-start text-right">
                            <div className="flex items-baseline gap-2">
                                <CountUp end={data?.yearRevenue || 0} />
                                <span className="text-sm text-emerald-400 font-bold">{data?.baseCurrencySymbol}</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground/40  mt-1">
                                {getDualCurrency(data?.yearRevenue, data?.revenueByCurrency)}
                            </span>
                        </div>
                        <BreakdownList items={data?.revenueBreakdown} symbol={data?.baseCurrencySymbol} color="emerald-600" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden group shadow-sm border-border rounded-3xl bg-card transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <IconBox icon={APP_ICONS.REPORTS.BRANCH_EXPENSE} className="bg-rose-600 text-white shadow-lg" boxSize="w-12 h-12" iconSize={24} />
                            <div>
                                <h3 className="font-black text-foreground text-sm">مصاريف {data?.selectedYear}</h3>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Yearly Expenses</p>
                            </div>
                        </div>
                        <div className="text-3xl font-black text-rose-600 dark:text-rose-500 border-t border-border pt-4 flex flex-col items-start text-right">
                            <div className="flex items-baseline gap-2">
                                <CountUp end={data?.yearExpenses || 0} />
                                <span className="text-sm text-rose-400 font-bold">{data?.baseCurrencySymbol}</span>
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground/40  mt-1">
                                {getDualCurrency(data?.yearExpenses, data?.expenseByCurrency)}
                            </span>
                        </div>
                        <BreakdownList items={data?.expenseBreakdownEntities} symbol={data?.baseCurrencySymbol} color="rose-600" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ─── Multi-Currency Summary Cards ──────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CurrencyCard
                    title="أرصدة الأصول"
                    subtitle="All-Time Balances"
                    icon={APP_ICONS.MODULES.COLLECT}
                    color="blue-600"
                    gradientFrom="from-blue-500"
                    gradientTo="to-indigo-600"
                    items={data?.assetsByCurrency}
                    loading={loading}
                    emptyText="لا توجد أرصدة أصول مسجلة"
                    baseCurrencySymbol={data?.baseCurrencySymbol}
                    baseCurrencyCode={data?.baseCurrencyCode}
                    breakdown={data?.assetsBreakdown}
                />

                <CurrencyCard
                    title="إيرادات الفترة"
                    subtitle="Revenue Summary"
                    icon={APP_ICONS.REPORTS.BRANCH_REVENUE}
                    color="emerald-600"
                    gradientFrom="from-emerald-500"
                    gradientTo="to-teal-600"
                    items={data?.revenueByCurrency}
                    loading={loading}
                    emptyText="لا توجد إيرادات مسجلة"
                    baseCurrencySymbol={data?.baseCurrencySymbol}
                    baseCurrencyCode={data?.baseCurrencyCode}
                    breakdown={data?.revenueBreakdown}
                />

                <CurrencyCard
                    title="مصاريف الفترة"
                    subtitle="Expenses Summary"
                    icon={APP_ICONS.REPORTS.BRANCH_EXPENSE}
                    color="rose-600"
                    gradientFrom="from-rose-500"
                    gradientTo="to-pink-600"
                    items={data?.expenseByCurrency}
                    loading={loading}
                    emptyText="لا توجد مصاريف مسجلة"
                    baseCurrencySymbol={data?.baseCurrencySymbol}
                    baseCurrencyCode={data?.baseCurrencyCode}
                    breakdown={data?.expenseBreakdownEntities}
                />
            </div>

            {/* ─── Recent Transactions + Expense Breakdown ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-sm border-border rounded-[2.5rem] overflow-hidden bg-card">
                    <CardHeader className="border-b border-border bg-muted/30 p-8">
                        <PageHeader
                            icon={APP_ICONS.MODULES.PERIODS}
                            title="النشاط المالي الأخير"
                            description="أحدث العمليات المسجلة في النظام"
                            iconClassName="bg-card text-muted-foreground shadow-sm"
                            iconSize={16}
                            variant="simple"
                        />
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            {loading ? (
                                <div className="flex justify-center py-10"><APP_ICONS.STATE.LOADING className="animate-spin text-muted-foreground/40" /></div>
                            ) : data?.recentTransactions?.length > 0 ? (data.recentTransactions.map((entry: any) => (
                                <div
                                    key={entry.id}
                                    onClick={() => handleNavigate(entry)}
                                    className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group cursor-pointer"
                                >
                                    <div className="flex flex-row-reverse justify-between items-center w-full">
                                        <div className="text-right flex flex-col items-start min-w-[110px]">
                                            <p className="font-black text-foreground text-base">
                                                {formatDashboardNumber(entry.baseAmount || 0)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1">
                                                <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-tighter">{data?.baseCurrencyCode}</p>
                                                <span className="text-[10px] text-muted-foreground/40 font-black">{data?.baseCurrencySymbol}</span>
                                            </div>
                                            {entry.currencyCode !== data?.baseCurrencyCode && (
                                                <p className="text-[10px] font-bold text-muted-foreground/40 mt-1 tabular-nums">
                                                    ({formatDashboardNumber(entry.originalAmount || 0)} {entry.currencySymbol})
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className="w-11 h-11 rounded-2xl bg-muted/40 flex flex-col items-center justify-center border border-border group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-colors shrink-0 shadow-sm">
                                                <span className="text-xs font-black text-muted-foreground/60 group-hover:text-blue-600 dark:group-hover:text-blue-400 uppercase leading-none mb-0.5">
                                                    #{entry.entryNumber}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-right truncate">
                                                <h4 className="font-black text-foreground text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">{entry.description || 'بدون وصف'}</h4>
                                                <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-bold leading-none">
                                                    <Badge variant="outline" className="text-[9px] font-black h-4 px-1 shrink-0">{entry.branch?.name}</Badge>
                                                    <span className="mx-0.5">•</span>
                                                    <span>{new Date(entry.date).toLocaleDateString('ar-AR')}</span>
                                                    <APP_ICONS.ACTIONS.CALENDAR size={10} className="shrink-0" />
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                                <APP_ICONS.ACTIONS.VIEW size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))) : (
                                <div className="text-center py-12 text-muted-foreground/60 font-medium">لا توجد عمليات حديثة</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-border rounded-[2.5rem] overflow-hidden flex flex-col bg-card">
                    <CardHeader className="border-b border-border bg-muted/30 p-8">
                        <PageHeader
                            icon={APP_ICONS.ACTIONS.ACTIVITY}
                            title="توزيع المصاريف"
                            description="حسب التصنيف"
                            iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm"
                            iconSize={16}
                            variant="simple"
                        />
                    </CardHeader>
                    <CardContent className="p-8 flex-1 flex flex-col">
                        <div className="mb-8">
                            <ExpensePieChart data={data?.expenseBreakdown || []} />
                        </div>
                        <div className="space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-10"><APP_ICONS.STATE.LOADING className="animate-spin text-muted-foreground/40" /></div>
                            ) : data?.expenseBreakdown?.length > 0 ? (
                                data.expenseBreakdown.map((item: any) => (
                                    <div key={item.name} className="group">
                                        <div className="flex flex-row-reverse justify-between items-center text-xs mb-2 w-full">
                                            <span className="font-black text-slate-900 dark:text-slate-100 text-right min-w-[100px]">
                                                {formatDashboardNumber(Math.abs(item.value))}
                                                <span className="text-[9px] text-muted-foreground/60 tracking-tighter ml-1">{data?.baseCurrencySymbol}</span>
                                            </span>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-slate-600 dark:text-slate-400 font-black group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors truncate">{item.name}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{
                                                    width: `${Math.min(100, Math.max(1, (Math.abs(item.value) / Math.abs(data.yearExpenses || 1)) * 100))}%`,
                                                    backgroundColor: item.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-muted-foreground font-medium bg-muted/30 rounded-xl border border-dashed border-border text-xs">لا توجد مصاريف مسجلة</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Trend Visualization ──────────────── */}
            <Card className="shadow-sm border-border rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <PageHeader
                        icon={APP_ICONS.ACTIONS.ACTIVITY}
                        title={`تحليل الأداء المالي لعام ${data?.selectedYear}`}
                        description="مقارنة شهرية بين الإيرادات والمصاريف والربح الصافي"
                        iconClassName="bg-blue-600 shadow-blue-200"
                        iconSize={18}
                        variant="simple"
                    />
                </CardHeader>
                <CardContent className="p-8">
                    <FinancialTrendChart data={data?.financialTrend || []} />
                </CardContent>
            </Card>

        </div>
    );
}
