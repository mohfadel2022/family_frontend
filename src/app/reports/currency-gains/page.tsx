"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Globe, ArrowUpRight, ArrowDownRight, Calendar, Download, Info, Loader2, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const ExchangeReportPage = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const [reportRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/exchange-report`, {
                    params: { startDate: dateRange.start, endDate: dateRange.end },
                    ...AUTH_HEADER
                }),
                axios.get(`${API_BASE}/`, AUTH_HEADER)
            ]);
            setReport(reportRes.data);
            setBaseCurrency(currRes.data.find((c: any) => c.isBase) || { code: '---' });
        } catch (error) {
            console.error('Error fetching exchange report:', error);
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
                <p className="text-slate-500 font-bold text-sm">جاري تحليل فروقات العملة...</p>
            </div>
        );
    }

    const currencyCode = baseCurrency?.code || '---';

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={Globe}
                    title="فروقات العملة"
                    description="Currency Exchange Gains & Losses"
                    iconClassName="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-200"
                    iconSize={24}
                />
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs shadow-lg shadow-slate-200">
                    <Download size={16} />
                    تصدير التقرير
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-black text-xs">
                    <Calendar size={18} className="text-blue-500" />
                    <span>فترة التقييم:</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <input
                        type="date"
                        className="bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-slate-700"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span className="text-slate-300">-</span>
                    <input
                        type="date"
                        className="bg-transparent px-3 py-1.5 outline-none font-mono text-xs font-bold text-slate-700"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
                <button
                    onClick={fetchReport}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all text-xs flex items-center gap-2 shadow-lg shadow-blue-100"
                >
                    <RefreshCcw size={16} />
                    تحديث التقرير
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-emerald-100 shadow-sm text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 blur-2xl rounded-full"></div>
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-50">
                        <ArrowUpRight size={20} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">أرباح الصرف</p>
                    <h3 className="text-2xl font-black font-mono text-emerald-600">+{report?.summary.gains.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-rose-100 shadow-sm text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 blur-2xl rounded-full"></div>
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-rose-50">
                        <ArrowDownRight size={20} />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">خسائر الصرف</p>
                    <h3 className="text-2xl font-black font-mono text-rose-600">-{report?.summary.losses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-center text-white relative overflow-hidden group border border-blue-500/20 shadow-blue-500/5">
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full"></div>
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
                        <Globe size={20} />
                    </div>
                    <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1.5">صافي الفرق ({currencyCode})</p>
                    <h3 className="text-2xl font-black font-mono text-blue-400">{report?.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تفاصيل العمليات المؤثرة</h3>
                    <span className="text-[10px] font-black text-slate-400 tracking-tight">TRANSACTION DETAILS</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">التاريخ</th>
                                <th className="py-4 px-6">البيان والشرح</th>
                                <th className="py-4 px-6">الحساب المتأثر</th>
                                <th className="py-4 px-6 text-center">القيمة ({currencyCode})</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {report?.details.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-3.5 px-6 font-mono text-slate-500 text-[11px] font-bold">
                                        {new Date(item.date).toLocaleDateString('ar-SA')}
                                    </td>
                                    <td className="py-3.5 px-6 text-xs font-bold text-slate-800">{item.description}</td>
                                    <td className="py-3.5 px-6">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter",
                                            item.amount > 0 ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                        )}>
                                            {item.accountName}
                                        </span>
                                    </td>
                                    <td className={cn(
                                        "py-3.5 px-6 font-mono text-center font-black text-xs",
                                        item.amount > 0 ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                        {item.amount > 0 ? `+${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            {report?.details.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-300 font-bold text-xs italic">لا توجد فروقات عملة مسجلة في هذه الفترة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100 flex items-start gap-4">
                <div className="p-3 bg-white rounded-[1.2rem] text-blue-600 shadow-sm border border-blue-100">
                    <Info size={24} />
                </div>
                <div>
                    <h4 className="font-black text-blue-900 text-sm">حول أرباح وخسائر العملة</h4>
                    <p className="text-blue-800 text-xs leading-relaxed mt-1 font-bold opacity-70">
                        يتم احتساب هذه النتائج بناءً على الفرق بين سعر الصرف وقت تسجيل القيد وسعر الصرف المرجعي للعملة الأساسية. تعكس هذه الأرقام التأثير المباشر لتقلبات السوق على الأرصدة النقدية والذمم المالية الأجنبية.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExchangeReportPage;
