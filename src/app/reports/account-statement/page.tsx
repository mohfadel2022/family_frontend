"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Search, Calendar, Download, Printer, ArrowRightLeft, FileText, Loader2, RefreshCcw, Landmark } from 'lucide-react';
import axios from 'axios';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const AccountStatementPage = () => {
    const [accountId, setAccountId] = useState('');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingAccounts, setFetchingAccounts] = useState(true);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get(`${API_BASE}/accounts`, AUTH_HEADER);
            setAccounts(res.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        } finally {
            setFetchingAccounts(false);
        }
    };

    const fetchReport = async () => {
        if (!accountId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/reports/account-statement`, {
                params: {
                    accountId,
                    startDate: dateRange.start,
                    endDate: dateRange.end
                },
                ...AUTH_HEADER
            });
            setReport(res.data);
        } catch (error) {
            console.error('Error fetching report:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const totalDebit = report?.entries.reduce((sum: number, e: any) => sum + e.debit, 0) || 0;
    const totalCredit = report?.entries.reduce((sum: number, e: any) => sum + e.credit, 0) || 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={FileText}
                    title="كشف حساب تفصيلي"
                    description="Detailed Transaction Ledger"
                    iconClassName="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200"
                    iconSize={24}
                />
                <div className="flex gap-2">
                    <button className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm transition-all group">
                        <Printer size={18} />
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black transition-all font-black text-xs shadow-lg shadow-slate-200">
                        <Download size={16} />
                        تصدير كـ PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar Filter */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">الحساب المحاسبي</label>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <select
                                    disabled={fetchingAccounts}
                                    className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xs appearance-none cursor-pointer"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                >
                                    <option value="">اختر الحساب...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">من تاريخ</label>
                            <input
                                type="date"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xs"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">إلى تاريخ</label>
                            <input
                                type="date"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-xs"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            />
                        </div>

                        <button
                            disabled={loading || !accountId}
                            onClick={fetchReport}
                            className="w-full py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group text-xs disabled:opacity-50"
                        >
                            {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} className="group-hover:scale-110 transition-transform" />}
                            تحديث الكشف
                        </button>
                    </div>

                    {report && (
                        <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20">
                                        <Landmark size={18} />
                                    </div>
                                    <h4 className="font-black text-xs uppercase tracking-widest opacity-60">Account Summary</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                        <span className="text-slate-400">الرصيد الافتتاحي</span>
                                        <span className="font-mono text-white">{report.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                        <span className="text-slate-400">إجمالي مدين</span>
                                        <span className="font-mono text-emerald-400">+{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[11px] font-bold">
                                        <span className="text-slate-400">إجمالي دائن</span>
                                        <span className="font-mono text-rose-400">-{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 space-y-1">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Net Closing Balance</p>
                                        <h2 className="text-2xl font-black font-mono leading-none">{report.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-9">
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                        {!report ? (
                            <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4 border-2 border-dashed border-slate-100 m-6 rounded-3xl">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <ArrowRightLeft size={32} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800">يرجى اختيار حساب</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-1">اختر الحساب والفترة الزمنية لعرض كشف الحركة التفصيلي</p>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-right">
                                <thead className="bg-slate-50/70 text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                                    <tr>
                                        <th className="py-4 px-6">التاريخ</th>
                                        <th className="py-4 px-6">رقم القيد</th>
                                        <th className="py-4 px-6">البيان والشرح</th>
                                        <th className="py-4 px-6 text-center">مدين</th>
                                        <th className="py-4 px-6 text-center">دائن</th>
                                        <th className="py-4 px-6 text-center bg-blue-50/30">الرصيد</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="bg-slate-50 font-bold italic text-slate-500">
                                        <td colSpan={5} className="py-3 px-6 text-[10px] uppercase">رصيد أول المدة</td>
                                        <td className="py-3 px-6 text-center font-mono text-xs">{report.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    {report.entries.map((entry: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-3.5 px-6 shrink-0">
                                                <span className="text-[10px] font-black text-slate-500">{new Date(entry.date).toLocaleDateString('ar-SA')}</span>
                                            </td>
                                            <td className="py-3.5 px-6">
                                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-black text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-default">
                                                    #{entry.entryNumber}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-6 text-xs font-bold text-slate-700 max-w-[200px] truncate">{entry.description}</td>
                                            <td className="py-3.5 px-6 font-mono text-center text-xs font-black text-emerald-600">
                                                {entry.debit > 0 ? entry.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="py-3.5 px-6 font-mono text-center text-xs font-black text-rose-600">
                                                {entry.credit > 0 ? entry.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="py-3.5 px-6 font-mono text-center font-black text-slate-900 bg-blue-50/20 text-xs">
                                                {entry.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                    {report.entries.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-400 font-bold text-sm italic">لا توجد حركات مسجلة في هذه الفترة</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-widest">
                                    <tr>
                                        <td colSpan={3} className="py-4 px-6">الرصيد الختامي للحساب</td>
                                        <td className="text-center font-mono text-emerald-600">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="text-center font-mono text-rose-600">({totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })})</td>
                                        <td className="text-center font-mono text-blue-600 bg-blue-50/40 text-sm">
                                            {report.closingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {report.currency}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountStatementPage;
