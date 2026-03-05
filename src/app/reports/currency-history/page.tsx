"use client";

import React, { useState, useEffect } from 'react';
import {
    History,
    Calendar,
    FileDown,
    Printer,
    ArrowLeftRight,
    Loader2,
    Search,
    Filter,
    ArrowUpDown,
    Coins
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const CurrencyHistoryReport = () => {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCurrencies, setFetchingCurrencies] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await axios.get(`${API_BASE}/currencies`, AUTH_HEADER);
                const foreignOnly = res.data.filter((c: any) => !c.isBase);
                setCurrencies(foreignOnly);
                if (foreignOnly.length > 0) {
                    setSelectedCurrency(foreignOnly[0].id);
                }
            } catch (err) {
                toast.error('فشل تحميل العملات');
            } finally {
                setFetchingCurrencies(false);
            }
        };
        fetchCurrencies();
    }, []);

    const fetchHistory = async () => {
        if (!selectedCurrency) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/currencies/${selectedCurrency}/history`, AUTH_HEADER);
            let filtered = res.data;

            if (startDate) {
                const sDate = new Date(startDate);
                filtered = filtered.filter((h: any) => new Date(h.date) >= sDate);
            }
            if (endDate) {
                const eDate = new Date(endDate);
                filtered = filtered.filter((h: any) => new Date(h.date) <= eDate);
            }

            setHistory(filtered);
        } catch (err) {
            toast.error('فشل تحميل التقرير');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCurrency) {
            fetchHistory();
        }
    }, [selectedCurrency]);

    const handleExportPDF = () => {
        const curr = currencies.find(c => c.id === selectedCurrency);
        const exportData = history.map(h => ({
            date: new Date(h.date).toLocaleDateString('ar-DZ'),
            rate: Number(h.rate).toLocaleString(undefined, { minimumFractionDigits: 4 }),
            regDate: new Date(h.createdAt).toLocaleString('ar-DZ')
        }));

        exportToPDF(
            exportData,
            `Currency_History_${curr?.code}`,
            `تقرير سجل أسعار الصرف - ${curr?.name} (${curr?.code})`,
            ['التاريخ', 'سعر الصرف', 'تاريخ التسجيل'],
            ['date', 'rate', 'regDate'],
            `الفترة: ${startDate || 'الكل'} إلى ${endDate || 'الآن'}`,
            {}
        );
    };

    const handleExportExcel = () => {
        const curr = currencies.find(c => c.id === selectedCurrency);
        const exportData = history.map(h => ({
            'التاريخ': new Date(h.date).toLocaleDateString('ar-DZ'),
            'سعر الصرف': Number(h.rate),
            'تاريخ التسجيل': new Date(h.createdAt).toLocaleString('ar-DZ')
        }));

        exportToExcel(
            exportData,
            `Currency_History_${curr?.code}`,
            ['التاريخ', 'سعر الصرف', 'تاريخ التسجيل'],
            ['التاريخ', 'سعر الصرف', 'تاريخ التسجيل']
        );
    };

    if (fetchingCurrencies) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-black">جاري تحميل البيانات...</p>
            </div>
        );
    }

    const currentCurrency = currencies.find(c => c.id === selectedCurrency);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <PageHeader
                icon={History}
                title="تقرير سجل العملات"
                description="Currency Exchange Rate History Analysis"
                iconClassName="bg-gradient-to-br from-indigo-600 to-blue-700 shadow-blue-200"
            >
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 transition-all font-black flex gap-2"
                        disabled={history.length === 0}
                    >
                        <FileDown size={18} />
                        تصدير Excel
                    </Button>
                    <Button
                        onClick={handleExportPDF}
                        className="h-12 px-6 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all shadow-lg shadow-slate-200 font-black flex gap-2"
                        disabled={history.length === 0}
                    >
                        <Printer size={18} />
                        طباعة PDF
                    </Button>
                </div>
            </PageHeader>

            {/* Filters */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1">العملة</label>
                        <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold text-right" dir="rtl">
                                <SelectValue placeholder="اختر العملة" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {currencies.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-blue-600 font-black">{c.code}</span>
                                            <span>{c.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                                {currencies.length === 0 && <SelectItem value="none" disabled>لا توجد عملات أجنبية</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1">من تاريخ</label>
                        <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-12 pr-11 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mr-1">إلى تاريخ</label>
                        <div className="relative">
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="h-12 pr-11 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={fetchHistory}
                        className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-100 transition-all flex gap-2"
                    >
                        <Search size={18} />
                        تحديث البيانات
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                            <ArrowUpDown size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">تفاصيل التحركات</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Historical Exchange Rate Movements</p>
                        </div>
                    </div>
                    {currentCurrency && (
                        <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl border border-slate-100 shadow-sm">
                            <Coins className="text-emerald-500" size={18} />
                            <span className="text-slate-800 font-black text-sm">{currentCurrency.name}</span>
                            <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-lg text-[10px] font-black">{currentCurrency.code}</span>
                        </div>
                    )}
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <Loader2 size={40} className="animate-spin text-blue-600" />
                            <p className="text-slate-400 font-black animate-pulse">جاري سحب السجلات...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-slate-800 font-black text-lg mb-2">لا توجد سجلات</h3>
                            <p className="text-slate-400 font-bold text-sm">لم يتم العثور على أي تغييرات في السعر ضمن الفترة المحددة</p>
                        </div>
                    ) : (
                        <div className="border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">تاريخ السعر</th>
                                        <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">سعر الصرف</th>
                                        <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest">تاريخ الإضافة للنظام</th>
                                        <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">الفرق</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map((item, index) => {
                                        const prevItem = history[index + 1];
                                        const diff = prevItem ? Number(item.rate) - Number(prevItem.rate) : 0;

                                        return (
                                            <tr key={item.id} className="hover:bg-blue-50/20 transition-all group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <span className="font-mono font-black text-slate-700">{new Date(item.date).toLocaleDateString('ar-DZ')}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-blue-700 font-mono font-black text-lg">
                                                        {Number(item.rate).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <span className="text-slate-400 font-bold text-sm tracking-tight capitalize">
                                                        {new Date(item.createdAt).toLocaleString('ar-DZ')}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    {diff === 0 ? (
                                                        <span className="text-slate-300 font-bold text-[10px]">—</span>
                                                    ) : diff > 0 ? (
                                                        <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                                                            +{diff.toFixed(4)} ↑
                                                        </span>
                                                    ) : (
                                                        <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black">
                                                            {diff.toFixed(4)} ↓
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CurrencyHistoryReport;
