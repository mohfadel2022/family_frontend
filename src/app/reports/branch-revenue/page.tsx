"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Download, Printer, ArrowUpRight, Loader2, RefreshCcw, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { TotalSummary } from '@/components/ui/TotalSummary';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const BranchRevenuePage = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // We'll fetch all branches and for each branch, get its income statement filtered by revenue
            const [branchRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/branches`, AUTH_HEADER),
                axios.get(`${API_BASE}/`, AUTH_HEADER)
            ]);

            setBaseCurrency(currRes.data.find((c: any) => c.isBase) || { code: '---' });

            const branchDetails = await Promise.all(branchRes.data.map(async (branch: any) => {
                const res = await axios.get(`${API_BASE}/reports/income-statement`, {
                    params: {
                        branchId: branch.id,
                        startDate: dateRange.start,
                        endDate: dateRange.end
                    },
                    ...AUTH_HEADER
                });
                return {
                    ...branch,
                    revenue: res.data.totalRevenue,
                    details: res.data.revenues
                };
            }));

            setBranches(branchDetails);
        } catch (error) {
            console.error('Error fetching branch revenue:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const totalRevenue = branches.reduce((sum, b) => sum + (b.revenue || 0), 0);

    if (loading && branches.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold text-sm">جاري تحليل إيرادات الجهات...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={ArrowUpRight}
                    title="إيرادات الجهات"
                    description={`تحليل مقارن لمصادر الدخل لكل فرع (${baseCurrency?.code || '---'})`}
                    iconClassName="bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200"
                    iconSize={24}
                />
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs shadow-lg shadow-slate-200">
                    <Download size={16} />
                    حفظ التقرير
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-black text-xs">
                    <Calendar size={18} className="text-amber-500" />
                    <span>فترة التحليل:</span>
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
                    onClick={fetchData}
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-xl font-black hover:bg-amber-700 transition-all text-xs flex items-center gap-2 shadow-lg shadow-amber-100"
                >
                    <RefreshCcw size={16} />
                    تحديث المقارنة
                </button>
            </div>

            {/* Branches Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
                    <div key={branch.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors"></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-amber-400 transition-colors">Branch Revenue</span>
                        </div>

                        <h3 className="text-lg font-black text-slate-800 mb-1">{branch.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-6">{branch.code || '---'}</p>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                                <span className="text-xs font-bold text-slate-500 italic">إجمالي الإيرادات</span>
                                <h2 className="text-2xl font-black font-mono text-amber-600 leading-none">
                                    {branch.revenue.toLocaleString()}
                                </h2>
                            </div>

                            <div className="pt-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-3">تفاصيل الإيرادات</p>
                                <div className="space-y-2">
                                    {branch.details.slice(0, 3).map((det: any, i: number) => (
                                        <div key={i} className="flex justify-between text-[11px] font-bold">
                                            <span className="text-slate-600">{det.name}</span>
                                            <span className="text-slate-900 font-mono">{det.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {branch.details.length > 3 && (
                                        <p className="text-[9px] text-slate-300 italic text-center pt-2">+{branch.details.length - 3} حسابات أخرى</p>
                                    )}
                                    {branch.details.length === 0 && (
                                        <p className="text-[10px] text-slate-300 italic py-2">لا توجد إيرادات مسجلة</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${totalRevenue > 0 ? (branch.revenue / totalRevenue) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <span className="text-[10px] font-black text-amber-600 mr-4 shrink-0">
                                {totalRevenue > 0 ? Math.round((branch.revenue / totalRevenue) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Total Footer */}
            <TotalSummary
                icon={TrendingUp}
                title="إجمالي إيرادات الصندوق"
                subtitle="Consolidated Family Fund Revenue"
                amount={totalRevenue}
                amountLabel={`Total Base Income (${baseCurrency?.code || '---'})`}
                accentColorClassName="text-amber-500"
                borderColorClassName="border-amber-500/10"
                shadowColorClassName="shadow-amber-900/10"
                iconClassName="bg-amber-500 shadow-amber-500/20"
            />
        </div>
    );
};

export default BranchRevenuePage;
