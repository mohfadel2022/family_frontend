"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;

const IncomeStatementPage = () => {
    const theme = usePageTheme();
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);
    const [maxLevel, setMaxLevel] = useState('all');

    const fetchReport = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                axios.get(`${API_BASE}/reports/income-statement`, {
                    params: { startDate: dateRange.start, endDate: dateRange.end },
                    ...getAuthHeader()
                }),
                axios.get(`${API_BASE}/currencies`, getAuthHeader())
            ]);

            const reportData = results[0].status === 'fulfilled' ? results[0].value.data : null;
            const currenciesData = results[1].status === 'fulfilled' ? results[1].value.data : [];

            setReport(reportData);
            const base = currenciesData.find((c: any) => c.isBase);
            setBaseCurrency(base || { code: '---', symbol: '' });
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading && !report) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <APP_ICONS.STATE.LOADING className={cn("w-10 h-10 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-bold text-sm">جاري تحميل البيانات المالية...</p>
            </div>
        );
    }

    if (!report) return <div className={cn("p-8 text-center font-bold", theme.accent)}>خطأ في تحميل البيانات</div>;

    const buildSortedTree = (items: any[]) => {
        if (!items) return [];
        const itemMap: Record<string, any> = {};
        items.forEach(item => {
            itemMap[item.id] = { ...item, children: [] };
        });

        const roots: any[] = [];
        items.forEach(item => {
            if (item.parentId && itemMap[item.parentId]) {
                itemMap[item.parentId].children.push(itemMap[item.id]);
            } else {
                roots.push(itemMap[item.id]);
            }
        });

        const flatten = (nodes: any[], level = 0): any[] => {
            nodes.sort((a, b) => (a.code || '').localeCompare(b.code || '', undefined, { numeric: true }));
            let result: any[] = [];
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children.length > 0) {
                    if (maxLevel === 'all' || level < parseInt(maxLevel)) {
                        result = result.concat(flatten(node.children, level + 1));
                    }
                }
            });
            return result;
        };

        return flatten(roots);
    };

    const treeRevenues = buildSortedTree(report.revenues);
    console.log(treeRevenues);
    const treeExpenses = buildSortedTree(report.expenses);

    const currencyCode = baseCurrency?.code || '---';

    return (
        <ProtectedRoute permission="REPORTS_INCOME_STATEMENT_VIEW">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <PageHeader
                icon={APP_ICONS.REPORTS.INCOME_STATEMENT}
                title="قائمة الدخل"
                description={`Income Statement & Profitability Analytics (${baseCurrency?.code || '---'})`}
                iconSize={24}
                className="mb-8"
            >
                <div className="flex gap-2">
                    <WithPermission permission="REPORTS_INCOME_STATEMENT_EXPORT">
                        <CustomButton
                            variant="outline"
                            onClick={() => {
                                import('@/lib/exportUtils').then(({ exportToExcel }) => {
                                    const exportData = [
                                        ...treeRevenues.map((r: any) => ({
                                            Category: 'Income',
                                            Name: '  '.repeat(r.level) + r.name,
                                            Foreign: !r.isBase ? `${Number(r.foreignAmount).toFixed(2)} ${r.currency}` : '-',
                                            Amount: r.amount.toFixed(2)
                                        })),
                                        { Category: 'Income', Name: 'Total Income', Foreign: '', Amount: report.totalRevenue },
                                        ...treeExpenses.map((e: any) => ({
                                            Category: 'Expenses',
                                            Name: '  '.repeat(e.level) + e.name,
                                            Foreign: !e.isBase ? `${Number(e.foreignAmount).toFixed(2)} ${e.currency}` : '-',
                                            Amount: e.amount.toFixed(2)
                                        })),
                                        { Category: 'Expenses', Name: 'Total Expenses', Foreign: '', Amount: report.totalExpense },
                                        { Category: 'Summary', Name: 'Net Income', Foreign: '', Amount: report.netIncome }
                                    ];
                                    exportToExcel(
                                        exportData,
                                        'Statement_Of_Income',
                                        ['التصنيف', 'البيان', 'المبلغ (أجنبي)', `المبلغ (${currencyCode})`],
                                        ['Category', 'Name', 'Foreign', 'Amount']
                                    );
                                });
                            }}
                            className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-input text-foreground/80 hover:bg-muted/50 font-black text-xs transition-all"
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={16} className="text-emerald-500" />
                            Excel
                        </CustomButton>
                    </WithPermission>
                    <WithPermission permission="REPORTS_INCOME_STATEMENT_EXPORT">
                        <CustomButton
                            onClick={() => {
                                import('@/lib/exportUtils').then(({ exportToPDF }) => {
                                    const exportData = [
                                        ...treeRevenues.map((r: any) => ({
                                            Category: 'Income',
                                            Name: '  '.repeat(r.level) + r.name,
                                            Foreign: !r.isBase ? `${Number(r.foreignAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${r.currency}` : '-',
                                            Amount: r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                        })),
                                        { Category: 'Income', Name: 'Total Income', Foreign: '', Amount: report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                                        ...treeExpenses.map((e: any) => ({
                                            Category: 'Expenses',
                                            Name: '  '.repeat(e.level) + e.name,
                                            Foreign: !e.isBase ? `${Number(e.foreignAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${e.currency}` : '-',
                                            Amount: e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                        })),
                                        { Category: 'Expenses', Name: 'Total Expenses', Foreign: '', Amount: report.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
                                        { Category: 'Summary', Name: 'Net Income', Foreign: '', Amount: report.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                                    ];
                                    const subtitle = dateRange.start && dateRange.end
                                        ? `الفترة من ${dateRange.start} إلى ${dateRange.end}`
                                        : 'كافة الفواتير المسجلة';

                                    exportToPDF(
                                        exportData,
                                        'Statement_Of_Income',
                                        'قائمة الدخل',
                                        ['التصنيف', 'البيان', 'المبلغ (أجنبي)', `المبلغ (${currencyCode})`],
                                        ['Category', 'Name', 'Foreign', 'Amount'],
                                        subtitle,
                                        {
                                            Amount: Number(report.netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })
                                        }
                                    );
                                });
                            }}
                            variant="primary"
                            className="h-11 px-4 text-xs"
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={16} className="text-rose-400" />
                            PDF
                        </CustomButton>
                    </WithPermission>
                </div>
            </PageHeader>

            {/* Filters */}
            <div className="bg-card p-4 rounded-3xl border border-border shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-muted-foreground font-black text-xs">
                    <APP_ICONS.ACTIONS.CALENDAR size={18} className={theme.accent} />
                    <span>الفترة الزمنية:</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl border border-border h-11">
                    <Input
                        type="date"
                        className={cn("bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-foreground/80 border-none shadow-none focus-visible:ring-0 max-w-[140px]", theme.accent.replace('text-', 'focus-visible:ring-'))}
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-muted-foreground/40">/</span>
                    <Input
                        type="date"
                        className={cn("bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-foreground/80 border-none shadow-none focus-visible:ring-0 max-w-[140px]", theme.accent.replace('text-', 'focus-visible:ring-'))}
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-2 bg-muted/50 border border-input rounded-xl px-0 group h-11 w-40 overflow-hidden">
                    <Select value={maxLevel} onValueChange={setMaxLevel}>
                        <SelectTrigger className="w-full bg-transparent border-0 ring-offset-transparent focus:ring-0 shadow-none font-black text-xs text-foreground/80 h-full !outline-none" dir="rtl">
                        <div className="flex items-center gap-2">
                            <APP_ICONS.ACTIONS.ACTIVITY size={16} className={theme.accent} />
                            <SelectValue placeholder="المستوى" />
                        </div>
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">جميع المستويات</SelectItem>
                            <SelectItem value="0">المستوى 1</SelectItem>
                            <SelectItem value="1">المستوى 2</SelectItem>
                            <SelectItem value="2">المستوى 3</SelectItem>
                            <SelectItem value="3">المستوى 4</SelectItem>
                            <SelectItem value="4">المستوى 5</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <CustomButton
                    disabled={loading}
                    onClick={fetchReport}
                    variant="primary"
                    className="h-11 px-6"
                >
                    {loading ? <APP_ICONS.ACTIONS.REFRESH size={16} className="animate-spin" /> : 'تحديث البيانات'}
                </CustomButton>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cn("bg-card p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group transition-all", theme.border.replace('border-', 'border-').replace('100', '200'))}>
                    <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-10", theme.primary)}></div>
                    <p className="text-emerald-600 font-black text-[11px] uppercase tracking-widest mb-1.5">إجمالي الإيرادات</p>
                    <h3 className="text-2xl font-black font-mono text-emerald-700 flex items-baseline gap-2">
                        {report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold opacity-60">{currencyCode}</span>
                    </h3>
                </div>
                <div className={cn("bg-card p-6 rounded-[2rem] border shadow-sm relative overflow-hidden group transition-all", theme.border.replace('border-', 'border-').replace('100', '200'))}>
                    <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-10", theme.primary)}></div>
                    <p className="text-rose-600 font-black text-[11px] uppercase tracking-widest mb-1.5">إجمالي المصاريف</p>
                    <h3 className="text-2xl font-black font-mono text-rose-700 flex items-baseline gap-2">
                        {report.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold opacity-60">{currencyCode}</span>
                    </h3>
                </div>
                <div className={cn("p-6 rounded-[2.2rem] text-white shadow-xl shadow-md relative overflow-hidden", theme.primary.replace('bg-', 'bg-').replace('-700', '-900'))}>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
                    <p className="text-white/40 font-black text-[11px] uppercase tracking-widest mb-1.5">صافي الفائض / العجز</p>
                    <h3 className="text-2xl font-black font-mono flex items-baseline gap-2">
                        {report.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold opacity-60">{currencyCode}</span>
                    </h3>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-card rounded-[2.5rem] shadow-sm border border-border overflow-hidden">
                {/* Revenues */}
                <div className="px-5 py-4 bg-muted/50/70 border-b border-border flex items-center justify-between">
                    <h2 className={cn("text-[11px] font-black uppercase tracking-widest w-[40%] text-right py-2 px-4 rounded-lg", theme.muted, theme.accent)}>البيان</h2>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest w-[30%] text-center py-2 px-4 rounded-lg mx-2", theme.muted, "text-rose-600")}>المبلغ (أجنبي)</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest w-[30%] text-left py-2 px-4 rounded-lg", theme.muted, "text-emerald-600")}>المبلغ ({currencyCode})</span>
                </div>
                <div className="p-6 space-y-3">
                    {treeRevenues.map((rev: any, i: number) => (
                        <div key={i} className={cn(
                            "flex justify-between items-center py-3 px-3 hover:bg-muted/50 rounded-xl transition-all border-b border-border/50 last:border-0",
                            rev.level === 0 ? "bg-muted/50/20" : ""
                        )}>
                            <div
                                className="flex items-center gap-2 w-[40%]"
                                style={{ paddingRight: `${rev.level * 20}px` }}
                            >
                                <div className={cn(
                                    "w-0.5 h-3 rounded-full",
                                    rev.level === 0 ? "bg-emerald-500" : "bg-slate-200"
                                )} />
                                <span className={cn("text-foreground/80 font-black tracking-tight", rev.level === 0 ? "text-sm" : "text-xs")}>
                                    {rev.name}
                                </span>
                            </div>
                            <div className="w-[30%] text-center">
                                {!rev.isBase ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-emerald-700 font-mono text-[11px] font-black">
                                            {Number(rev.foreignAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[8px] font-black text-emerald-700 uppercase">{rev.currency}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground/40 font-mono text-[10px]">-</span>
                                )}
                            </div>
                            <span className={cn("font-mono font-black w-[30%] text-left", rev.level === 0 ? "text-sm text-foreground" : "text-xs text-muted-foreground")}>
                                {rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    {treeRevenues.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground/60 font-bold text-xs italic">لا توجد إيرادات مسجلة في هذه الفترة</p>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-dashed border-border px-3">
                        <span className="font-black text-foreground/90 text-sm w-[40%]">إجمالي الإيرادات</span>
                        <div className="w-[30%]" />
                        <span className="font-black font-mono text-lg text-emerald-600 underline decoration-emerald-200 decoration-4 underline-offset-8 w-[30%] text-left">
                            {report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Expenses */}
                <div className="px-5 py-4 bg-muted/50/70 border-t border-b border-border flex items-center justify-between mt-4">
                    <h2 className={cn("text-[11px] font-black uppercase tracking-widest w-[40%] text-right py-2 px-4 rounded-lg", theme.muted, theme.accent)}>البيان</h2>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest w-[30%] text-center py-2 px-4 rounded-lg mx-2", theme.muted, "text-rose-600")}>المبلغ (أجنبي)</span>
                    <span className={cn("text-[10px] font-black uppercase tracking-widest w-[30%] text-left py-2 px-4 rounded-lg", theme.muted, "text-emerald-600")}>المبلغ ({currencyCode})</span>
                </div>
                <div className="p-6 space-y-3">
                    {treeExpenses.map((exp: any, i: number) => (
                        <div key={i} className={cn(
                            "flex justify-between items-center py-3 px-3 hover:bg-muted/50 rounded-xl transition-all border-b border-border/50 last:border-0",
                            exp.level === 0 ? "bg-muted/50/20" : ""
                        )}>
                            <div
                                className="flex items-center gap-2 w-[40%]"
                                style={{ paddingRight: `${exp.level * 20}px` }}
                            >
                                <div className={cn(
                                    "w-0.5 h-3 rounded-full",
                                    exp.level === 0 ? "bg-rose-500" : "bg-slate-200"
                                )} />
                                <span className={cn("text-foreground/80 font-black tracking-tight", exp.level === 0 ? "text-sm" : "text-xs")}>
                                    {exp.name}
                                </span>
                            </div>
                            <div className="w-[30%] text-center">
                                {!exp.isBase ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-emerald-600 font-mono text-[11px] font-black">
                                            {Number(exp.foreignAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[8px] font-black text-emerald-600 uppercase">{exp.currency}</span>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground/40 font-mono text-[10px]">-</span>
                                )}
                            </div>
                            <span className={cn("font-mono font-black w-[30%] text-left", exp.level === 0 ? "text-sm text-rose-700" : "text-xs text-rose-600")}>
                                ({exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                            </span>
                        </div>
                    ))}
                    {treeExpenses.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground/60 font-bold text-xs italic">لا توجد مصاريف مسجلة في هذه الفترة</p>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-dashed border-border px-3">
                        <span className="font-black text-foreground/90 text-sm w-[40%]">إجمالي المصاريف</span>
                        <div className="w-[30%]" />
                        <span className="font-black font-mono text-lg text-rose-600 underline decoration-rose-200 decoration-4 underline-offset-8 w-[30%] text-left">
                            ({report.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </span>
                    </div>
                </div>

                {/* Net Income Summary */}
                <div className="bg-muted/50 p-6 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-[2.5rem]">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-xl border transition-all", theme.muted, theme.accent, theme.border)}>
                            <APP_ICONS.STATE.INFO size={18} />
                        </div>
                        <div>
                            <h4 className="font-black text-foreground/90 text-sm">صافي المركز المالي للمؤسسة</h4>
                            <p className="text-[10px] text-muted-foreground/80 font-black uppercase tracking-tight">Performance Summary</p>
                        </div>
                    </div>
                    <div className="text-center md:text-left bg-card px-8 py-3 rounded-2xl border border-input shadow-sm">
                        <h2 className={cn("text-3xl font-black font-mono leading-none", report.netIncome >= 0 ? theme.accent : "text-rose-600")}>
                            {report.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h2>
                        <p className="text-[9px] text-muted-foreground/60 font-black mt-1 uppercase tracking-widest">{baseCurrency?.name || 'العملة الأساسية'}</p>
                    </div>
                </div>
            </div>
        </div>
        </ProtectedRoute>
    );
};

export default IncomeStatementPage;
