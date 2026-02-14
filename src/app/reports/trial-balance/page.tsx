"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, Filter, Download, Printer, Table, Loader2, RefreshCcw, Globe } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const TrialBalancePage = () => {
    const [branch, setBranch] = useState('all');
    const [branches, setBranches] = useState<any[]>([]);
    const [report, setReport] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tbRes, branchRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/reports/trial-balance`, {
                    params: { branchId: branch === 'all' ? undefined : branch },
                    ...AUTH_HEADER
                }),
                axios.get(`${API_BASE}/branches`, AUTH_HEADER),
                axios.get(`${API_BASE}/`, AUTH_HEADER)
            ]);

            setReport(tbRes.data);
            setBranches(branchRes.data);
            const base = currRes.data.find((c: any) => c.isBase);
            setBaseCurrency(base || { code: '---' });
        } catch (error) {
            console.error('Error fetching trial balance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [branch]);

    const filteredReport = report.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.includes(search)
    );

    const totalDebit = filteredReport.reduce((sum, item) => sum + Number(item.baseDebit), 0);
    const totalCredit = filteredReport.reduce((sum, item) => sum + Number(item.baseCredit), 0);

    if (loading && report.length === 0) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold text-sm">جاري إنشاء ميزان المراجعة...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with Premium Look */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={Table}
                    title="ميزان المراجعة"
                    description={`الأرصدة النهائية بالعملة الأساسية (${baseCurrency?.code || '---'})`}
                    iconClassName="bg-gradient-to-br from-indigo-500 to-blue-600 shadow-blue-200"
                    iconSize={24}
                />
                <div className="flex gap-2">
                    <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm transition-all group">
                        <Printer size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs shadow-lg shadow-slate-200">
                        <Download size={16} />
                        تصدير التقرير
                    </button>
                </div>
            </div>

            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-5">
                {/* Filters Row */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="بحث عن حساب بالاسم أو الكود..."
                            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xs"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 group">
                        <Globe size={16} className="text-blue-500" />
                        <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="bg-transparent py-2.5 outline-none font-black text-xs text-slate-700 min-w-[140px]"
                        >
                            <option value="all">جميع الفروع الموحدة</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 font-black text-xs transition-all shadow-sm"
                    >
                        {loading ? <RefreshCcw size={16} className="animate-spin text-blue-500" /> : <Filter size={16} className="text-blue-500" />}
                        تحديث النتائج
                    </button>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-2xl border border-slate-50">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                            <tr>
                                <th className="py-4 px-6">رقم الحساب</th>
                                <th className="py-4 px-6">اسم الحساب</th>
                                <th className="py-4 px-6">النوع</th>
                                <th className="py-4 px-6 text-center">مدين</th>
                                <th className="py-4 px-6 text-center">دائن</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReport.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-3.5 px-6 font-mono text-xs text-slate-500 font-bold">{item.code}</td>
                                    <td className="py-3.5 px-6 font-black text-slate-800 text-sm">{item.name}</td>
                                    <td className="py-3.5 px-6">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter",
                                            item.type === 'ASSET' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                item.type === 'REVENUE' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    item.type === 'EXPENSE' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                                                        "bg-slate-50 text-slate-600 border border-slate-200"
                                        )}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-6 font-mono text-center text-xs font-black text-slate-700">
                                        {Number(item.baseDebit) > 0 ? Number(item.baseDebit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="py-3.5 px-6 font-mono text-center text-xs font-black text-slate-700">
                                        {Number(item.baseCredit) > 0 ? Number(item.baseCredit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {filteredReport.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm italic">
                                        لا توجد بيانات مطابقة للبحث
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-black">
                            <tr>
                                <td colSpan={3} className="py-5 px-6 text-sm">الإجمالي بالعملة الموحدة ({baseCurrency?.code || '---'})</td>
                                <td className="py-5 px-6 text-center font-mono text-lg underline decoration-blue-500 decoration-2 underline-offset-4">
                                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-5 px-6 text-center font-mono text-lg underline decoration-blue-500 decoration-2 underline-offset-4">
                                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Warning Text */}
            <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-blue-800 text-[11px] font-black opacity-80">
                    ميزان المراجعة يتم حسابه بناءً على كافة القيود المرحّلة فقط. تأكد من ترحيل جميع القيود قبل استخراج الأرصدة الختامية.
                </p>
            </div>
        </div>
    );
};

export default TrialBalancePage;
