"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FilePieChart, Calendar, Download, Building2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCcw, Loader2, Printer, Info } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const IncomeStatementPage = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, currenciesRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/income-statement`, {
                    params: { startDate: dateRange.start, endDate: dateRange.end },
                    ...AUTH_HEADER
                }),
                axios.get(`${API_BASE}/`, AUTH_HEADER)
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

    const currencyCode = baseCurrency?.code || '---';

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={FilePieChart}
                    title="قائمة الدخل"
                    description={`Income Statement & Profitability Analytics (${baseCurrency?.code || '---'})`}
                    iconClassName="bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200"
                    iconSize={24}
                />
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all font-bold text-xs shadow-sm">
                        <Printer size={16} />
                        <span>طباعة</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs shadow-lg shadow-slate-200">
                        <Download size={16} />
                        <span>تصدير Excel</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-black text-xs">
                    <Calendar size={18} className="text-blue-500" />
                    <span>الفترة الزمنية:</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <input
                        type="date"
                        className="bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-slate-700"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-slate-300">/</span>
                    <input
                        type="date"
                        className="bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-slate-700"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
                <button
                    disabled={loading}
                    onClick={fetchReport}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all text-xs flex items-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                    {loading ? <RefreshCcw size={16} className="animate-spin" /> : 'تحديث البيانات'}
                </button>
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
                <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" size={18} />
                        الإيرادات التشغيلية
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Operating Revenues</span>
                </div>
                <div className="p-6 space-y-3">
                    {report.revenues.map((rev: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-2.5 px-3 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-50 last:border-0">
                            <span className="text-slate-700 font-bold text-sm">{rev.name}</span>
                            <span className="font-mono font-black text-slate-900 text-sm">
                                {rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                    {report.revenues.length === 0 && (
                        <p className="text-center py-8 text-slate-400 font-bold text-xs italic">لا توجد إيرادات مسجلة في هذه الفترة</p>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-dashed border-slate-100 px-3">
                        <span className="font-black text-slate-800 text-sm">إجمالي الإيرادات</span>
                        <span className="font-black font-mono text-lg text-emerald-600 underline decoration-emerald-200 decoration-4 underline-offset-8">
                            {report.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Expenses */}
                <div className="p-5 bg-slate-50/50 border-t border-b border-slate-100 flex items-center justify-between mt-4">
                    <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <TrendingDown className="text-rose-500" size={18} />
                        المصاريف والأعباء
                    </h2>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Operating Expenses</span>
                </div>
                <div className="p-6 space-y-3">
                    {report.expenses.map((exp: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-2.5 px-3 hover:bg-slate-50 rounded-xl transition-all border-b border-slate-50 last:border-0">
                            <span className="text-slate-700 font-bold text-sm">{exp.name}</span>
                            <span className="font-mono font-black text-rose-600 text-sm">
                                ({exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                            </span>
                        </div>
                    ))}
                    {report.expenses.length === 0 && (
                        <p className="text-center py-8 text-slate-400 font-bold text-xs italic">لا توجد مصاريف مسجلة في هذه الفترة</p>
                    )}
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-dashed border-slate-100 px-3">
                        <span className="font-black text-slate-800 text-sm">إجمالي المصاريف</span>
                        <span className="font-black font-mono text-lg text-rose-600 underline decoration-rose-200 decoration-4 underline-offset-8">
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
