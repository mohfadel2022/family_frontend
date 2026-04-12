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
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

// ─── Entity Breakdown List ──────────────────────────────────────────────
const BreakdownItem = ({ item, symbol, color, level = 0 }: { item: any, symbol: string, color?: string, level?: number }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
            <div className={cn(
                "flex flex-row-reverse justify-between   py-2.5 transition-all group/item rounded-xl px-3 -mx-2 hover:bg-muted/70",
                level === 0 ? "font-black bg-muted/30" : "font-bold text-muted-foreground/80",
                hasChildren && "cursor-pointer"
            )}
            onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col items-start min-w-[120px] text-right">
                    <span className={cn("text-foreground whitespace-nowrap", level === 0 ? "text-[15px]" : "text-[13px]")}>
                        {formatDashboardNumber(item.balance ?? item.total ?? 0)}
                        <span className="text-[10px] ml-1 opacity-50 font-black uppercase">{symbol}</span>
                    </span>
                    {item.symbol && item.symbol !== symbol && (
                        <span className={cn("text-[11px] font-bold mt-0.5 whitespace-nowrap", `text-${color}`)}>
                            ({formatDashboardNumber(item.originalBalance ?? item.originalTotal ?? 0)} {item.symbol})
                        </span>
                    )}
                </div>

                <span className="flex items-center justify-end gap-2.5 leading-none overflow-hidden text-right flex-1 select-none">
                    {hasChildren && (
                        <div className={cn("p-1 rounded-full bg-muted/80 group-hover:bg-accent transition-transform shrink-0", isExpanded ? "rotate-90" : "-rotate-90")}>
                            <APP_ICONS.ACTIONS.CHEVRON_LEFT size={10} />
                        </div>
                    )}
                    <span className="truncate">{item.name}</span>
                    {level === 0 && (
                        <div className={cn("w-1.5 h-4 rounded-full shrink-0 shadow-sm", `bg-${color}` || "bg-blue-500")}></div>
                    )}
                </span>
            </div>

            {hasChildren && isExpanded && (
                <div className="mr-5 border-r-2 border-border/30 space-y-1 mt-1 pr-3">
                    {item.children.map((child: any, idx: number) => (
                        <BreakdownItem key={child.name || idx} item={child} symbol={symbol} color={color} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

const BreakdownList = ({ items, symbol, loading, color, isDefaultExpanded = true }: { items: any[], symbol: string, loading?: boolean, color?: string, isDefaultExpanded?: boolean }) => {
    const [isExpanded, setIsExpanded] = React.useState(isDefaultExpanded);
    if (loading) return null;
    if (!items || items.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-border/50 w-full">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground transition-colors mb-3 group"
            >
                التفاصيل والتصنيفات
                <div className={cn("p-1 rounded-md bg-muted group-hover:bg-accent transition-all transform", isExpanded ? "rotate-180" : "")}>
                    <APP_ICONS.ACTIONS.CHEVRON_DOWN size={14} />
                </div>
            </button>

            {isExpanded && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    {items.map((item, idx) => (
                        <BreakdownItem key={item.name || idx} item={item} symbol={symbol} color={color} />
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

// ─── Financial Summary Card (Stacked Variant) ──────────────────────────
const FinancialSummaryCard = ({ 
    title, 
    subtitle, 
    icon, 
    amount, 
    symbol, 
    currencyItems, 
    breakdown, 
    color, 
    baseCurrencyCode, 
    textColor = "text-slate-800 dark:text-slate-100" 
}: any) => {
    const getDualCurrency = (amount: number, items: any[]) => {
        if (!items || items.length === 0) return null;
        const foreignItems = items.filter(item => item.code !== baseCurrencyCode);
        if (foreignItems.length === 1 && items.length === 1) {
            return ` (${formatDashboardNumber(foreignItems[0].total || foreignItems[0].balance || 0)})`;
        }
        return null;
    };

    return (
        <Card className="relative overflow-hidden group shadow-sm border-border rounded-3xl bg-card transition-all hover:shadow-lg w-full">
            <CardContent className="p-6">
                <div className="flex justify-between ">
                    <div className="flex items-center gap-4 mb-4">
                        <IconBox icon={icon} className={cn("text-white shadow-lg", color)} boxSize="w-12 h-12" iconSize={24} />
                        <div>
                            <h3 className="font-black text-foreground text-sm">{title}</h3>
                            <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">{subtitle}</p>
                        </div>
                    </div>
                    <div className={cn("text-2xl font-black border-t border-border pt-4 flex flex-col items-start text-right", textColor)}>
                        <div className="flex items-baseline gap-2">
                            <CountUp end={amount || 0} />
                            <span className="text-sm opacity-50 font-bold">{symbol}</span>
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground/40 mt-1">
                            {getDualCurrency(amount, currencyItems)}
                        </span>
                    </div>
                </div>

                <BreakdownList items={breakdown} symbol={symbol} color={color.split('-')[1] + '-' + color.split('-')[2]} />
            </CardContent>
        </Card>
    );
};

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
        return (
            <div className="gap-6 w-full grid grid-cols-1 md:grid-cols-2">
                <FinancialSummaryCard
                    title="إجمالي السيولة"
                    subtitle="Total Liquidity"
                    icon={APP_ICONS.MODULES.COLLECT}
                    amount={data?.totalLiquidity}
                    symbol={data?.baseCurrencySymbol}
                    currencyItems={data?.assetsByCurrency}
                    breakdown={data?.assetsBreakdown}
                    color="bg-blue-600"
                    baseCurrencyCode={data?.baseCurrencyCode}
                />

                <FinancialSummaryCard
                    title={`إيرادات ${data?.selectedYear}`}
                    subtitle="Yearly Revenue"
                    icon={APP_ICONS.REPORTS.BRANCH_REVENUE}
                    amount={data?.yearRevenue}
                    symbol={data?.baseCurrencySymbol}
                    currencyItems={data?.revenueByCurrency}
                    breakdown={data?.revenueBreakdown}
                    color="bg-emerald-600"
                    textColor="text-emerald-600 dark:text-emerald-500"
                    baseCurrencyCode={data?.baseCurrencyCode}
                />

                <FinancialSummaryCard
                    title={`مصاريف ${data?.selectedYear}`}
                    subtitle="Yearly Expenses"
                    icon={APP_ICONS.REPORTS.BRANCH_EXPENSE}
                    amount={data?.yearExpenses}
                    symbol={data?.baseCurrencySymbol}
                    currencyItems={data?.expenseByCurrency}
                    breakdown={data?.expenseBreakdownEntities}
                    color="bg-rose-600"
                    textColor="text-rose-600 dark:text-rose-500"
                    baseCurrencyCode={data?.baseCurrencyCode}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ─── Multi-Currency Summary Cards ──────────────── */}
            <CollapsibleSection
                title="أرصدة الأصول والتدفقات"
                description="Asset Balances & Revenue/Expense Summary"
                icon={APP_ICONS.MODULES.COLLECT}
                accentColor="bg-blue-600"
            >
                <div className="flex flex-col gap-6 w-full">
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
            </CollapsibleSection>

            {/* ─── Recent Transactions + Expense Breakdown ──────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CollapsibleSection
                        title="النشاط المالي الأخير"
                        description="Latest recorded transactions"
                        icon={APP_ICONS.MODULES.PERIODS}
                        accentColor="bg-slate-600"
                    >
                        <Card className="shadow-none border-0 bg-transparent overflow-hidden">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border/50">
                                    {loading ? (
                                        <div className="flex justify-center py-10"><APP_ICONS.STATE.LOADING className="animate-spin text-muted-foreground/40" /></div>
                                    ) : data?.recentTransactions?.length > 0 ? (data.recentTransactions.map((entry: any) => (
                                        <div
                                            key={entry.id}
                                            onClick={() => handleNavigate(entry)}
                                            className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors group cursor-pointer rounded-2xl"
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
                    </CollapsibleSection>
                </div>

                <CollapsibleSection
                    title="توزيع المصاريف"
                    description="Expense distribution"
                    icon={APP_ICONS.ACTIONS.ACTIVITY}
                    accentColor="bg-rose-600"
                >
                    <div className="flex flex-col">
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
                    </div>
                </CollapsibleSection>
            </div>

            {/* ─── Trend Visualization ──────────────── */}
            <CollapsibleSection
                title={`تحليل الأداء المالي لعام ${data?.selectedYear}`}
                description="Monthly comparison of revenue and expenses"
                icon={APP_ICONS.ACTIONS.ACTIVITY}
                accentColor="bg-indigo-600"
            >
                <div className="p-2">
                    <FinancialTrendChart data={data?.financialTrend || []} />
                </div>
            </CollapsibleSection>

        </div>
    );
}
