"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FilePieChart, Calendar, Download, Building2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2, Printer, Info, Layers } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const IncomeStatementPage = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);
    const [maxLevel, setMaxLevel] = useState('all');

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, currenciesRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/income-statement`, {
                    params: { startDate: dateRange.start, endDate: dateRange.end },
                    ...AUTH_HEADER
                }),
                axios.get(`${API_BASE}/currencies`, AUTH_HEADER)
            ]);

            setReport(reportRes.data);
            const base = currenciesRes.data.find((c: any) => c.isBase);
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
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold text-sm">جاري تحميل البيانات المالية...</p>
            </div>
        );
    }

    if (!report) return <div className="p-8 text-center text-rose-500 font-bold">خطأ في تحميل البيانات</div>;

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
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <PageHeader
                icon={FilePieChart}
                title="قائمة الدخل"
                description={`Income Statement & Profitability Analytics (${baseCurrency?.code || '---'})`}
                iconClassName="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200"
                iconSize={24}
                className="mb-8"
            >
                <div className="flex gap-2">
                    <Button
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
                        className="flex items-center gap-2 px-4 rounded-xl shadow-sm h-11 border-slate-200 text-slate-700 hover:bg-slate-50 font-black text-xs transition-all"
                    >
                        <Download size={16} className="text-emerald-500" />
                        Excel
                    </Button>
                    <Button
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
                        className="flex items-center gap-2 px-4 rounded-xl shadow-lg h-11 bg-slate-900 text-white hover:bg-black font-black text-xs transition-all"
                    >
                        <Download size={16} className="text-rose-400" />
                        PDF
                    </Button>
                </div>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-black text-xs">
                    <Calendar size={18} className="text-blue-500" />
                    <span>الفترة الزمنية:</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 h-11">
                    <Input
                        type="date"
                        className="bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-slate-700 border-none shadow-none focus-visible:ring-0 max-w-[140px]"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-slate-300">/</span>
                    <Input
                        type="date"
                        className="bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-slate-700 border-none shadow-none focus-visible:ring-0 max-w-[140px]"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-0 group h-11 w-40 overflow-hidden">
                    <Select value={maxLevel} onValueChange={setMaxLevel}>
                        <SelectTrigger className="w-full bg-transparent border-0 ring-offset-transparent focus:ring-0 shadow-none font-black text-xs text-slate-700 h-full !outline-none" dir="rtl">
                            <div className="flex items-center gap-2">
                                <Layers size={16} className="text-blue-500" />
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
                <Button
                    disabled={loading}
                    onClick={fetchReport}
                    className="px-6 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all text-xs h-11 flex items-center gap-2 shadow-lg shadow-blue-100"
                >
                    {loading ? <RefreshCcw size={16} className="animate-spin" /> : 'تحديث البيانات'}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full"></div>
                    <p className="text-emerald-600 font-black text-[11px] uppercase tracking-widest mb-1.5">إجمالي الإيرادات</p>
                    <h3 className="text-2xl font-black font-mono text-emerald-700 flex items-baseline gap-2">
                        {report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold opacity-60">{currencyCode}</span>
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-3xl rounded-full"></div>
                    <p className="text-rose-600 font-black text-[11px] uppercase tracking-widest mb-1.5">إجمالي المصاريف</p>
                    <h3 className="text-2xl font-black font-mono text-rose-700 flex items-baseline gap-2">
                        {report.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold opacity-60">{currencyCode}</span>
                    </h3>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2.2rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                    <p className="text-blue-400 font-black text-[11px] uppercase tracking-widest mb-1.5">صافي الفائض / العجز</p>
                    <h3 className="text-2xl font-black font-mono flex items-baseline gap-2">
                        {report.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-xs font-bold opacity-60">{currencyCode}</span>
                    </h3>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                {/* Revenues */}
                <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest w-[40%] text-right bg-blue-50/30 py-2 px-4 rounded-lg">البيان</h2>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%] text-center bg-rose-50/30 py-2 px-4 rounded-lg mx-2">المبلغ (أجنبي)</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%] text-left bg-emerald-50/30 py-2 px-4 rounded-lg">المبلغ ({currencyCode})</span>
                </div>
                <div className="p-6 space-y-3">
                    {treeRevenues.map((rev: any, i: number) => (
                        <div key={i} className={cn(
                            "flex justify-between items-center py-3 px-3 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-50 last:border-0",
                            rev.level === 0 ? "bg-slate-50/20" : ""
                        )}>
                            <div
                                className="flex items-center gap-2 w-[40%]"
                                style={{ paddingRight: `${rev.level * 20}px` }}
                            >
                                <div className={cn(
                                    "w-0.5 h-3 rounded-full",
                                    rev.level === 0 ? "bg-emerald-500" : "bg-slate-200"
                                )} />
                                <span className={cn("text-slate-700 font-black tracking-tight", rev.level === 0 ? "text-sm" : "text-xs")}>
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
                                    <span className="text-slate-300 font-mono text-[10px]">-</span>
                                )}
                            </div>
                            <span className={cn("font-mono font-black w-[30%] text-left", rev.level === 0 ? "text-sm text-slate-900" : "text-xs text-slate-600")}>
                                {rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    {treeRevenues.length === 0 && (
                        <p className="text-center py-8 text-slate-400 font-bold text-xs italic">لا توجد إيرادات مسجلة في هذه الفترة</p>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-dashed border-slate-100 px-3">
                        <span className="font-black text-slate-800 text-sm w-[40%]">إجمالي الإيرادات</span>
                        <div className="w-[30%]" />
                        <span className="font-black font-mono text-lg text-emerald-600 underline decoration-emerald-200 decoration-4 underline-offset-8 w-[30%] text-left">
                            {report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Expenses */}
                <div className="px-5 py-4 bg-slate-50/70 border-t border-b border-slate-100 flex items-center justify-between mt-4">
                    <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest w-[40%] text-right bg-blue-50/30 py-2 px-4 rounded-lg">البيان</h2>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%] text-center bg-rose-50/30 py-2 px-4 rounded-lg mx-2">المبلغ (أجنبي)</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%] text-left bg-emerald-50/30 py-2 px-4 rounded-lg">المبلغ ({currencyCode})</span>
                </div>
                <div className="p-6 space-y-3">
                    {treeExpenses.map((exp: any, i: number) => (
                        <div key={i} className={cn(
                            "flex justify-between items-center py-3 px-3 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-50 last:border-0",
                            exp.level === 0 ? "bg-slate-50/20" : ""
                        )}>
                            <div
                                className="flex items-center gap-2 w-[40%]"
                                style={{ paddingRight: `${exp.level * 20}px` }}
                            >
                                <div className={cn(
                                    "w-0.5 h-3 rounded-full",
                                    exp.level === 0 ? "bg-rose-500" : "bg-slate-200"
                                )} />
                                <span className={cn("text-slate-700 font-black tracking-tight", exp.level === 0 ? "text-sm" : "text-xs")}>
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
                                    <span className="text-slate-300 font-mono text-[10px]">-</span>
                                )}
                            </div>
                            <span className={cn("font-mono font-black w-[30%] text-left", exp.level === 0 ? "text-sm text-rose-700" : "text-xs text-rose-600")}>
                                ({exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                            </span>
                        </div>
                    ))}
                    {treeExpenses.length === 0 && (
                        <p className="text-center py-8 text-slate-400 font-bold text-xs italic">لا توجد مصاريف مسجلة في هذه الفترة</p>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-dashed border-slate-100 px-3">
                        <span className="font-black text-slate-800 text-sm w-[40%]">إجمالي المصاريف</span>
                        <div className="w-[30%]" />
                        <span className="font-black font-mono text-lg text-rose-600 underline decoration-rose-200 decoration-4 underline-offset-8 w-[30%] text-left">
                            ({report.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                        </span>
                    </div>
                </div>

                {/* Net Income Summary */}
                <div className="bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-center gap-4 rounded-b-[2.5rem]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl border border-blue-200">
                            <Info size={18} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-800 text-sm">صافي المركز المالي للمؤسسة</h4>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-tight">Performance Summary</p>
                        </div>
                    </div>
                    <div className="text-center md:text-left bg-white px-8 py-3 rounded-2xl border border-slate-200 shadow-sm">
                        <h2 className={cn("text-3xl font-black font-mono leading-none", report.netIncome >= 0 ? "text-blue-600" : "text-rose-600")}>
                            {report.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h2>
                        <p className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">{baseCurrency?.name || 'العملة الأساسية'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomeStatementPage;
