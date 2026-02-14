"use client";

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Check,
    AlertCircle,
    RefreshCw,
    Loader2,
    List,
    FilePlus2,
    Edit3,
    Calendar,
    ArrowLeftRight,
    Search,
    Filter,
    ChevronLeft,
    ChevronDown,
    Printer,
    Download,
    Building2,
    FileText,
    RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBox } from '@/components/ui/IconBox';

const API_BASE = 'http://localhost:4000/api';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

interface JournalLine {
    id?: string; // Generated on client or came from server
    tempId: string; // Internal state ID
    accountId: string;
    currencyId: string;
    currencyCode: string;
    debit: number;
    credit: number;
    exchangeRate: number;
    baseDebit: number;
    baseCredit: number;
}

const JournalPage = () => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [branchId, setBranchId] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([]);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMeta();
        fetchEntries();
    }, []);

    const fetchMeta = async () => {
        try {
            const [accRes, branchRes] = await Promise.all([
                axios.get(`${API_BASE}/meta/accounts`, AUTH_HEADER),
                axios.get(`${API_BASE}/meta/branches`, AUTH_HEADER)
            ]);
            setAccounts(accRes.data);
            setBranches(branchRes.data);
            if (branchRes.data.length > 0) setBranchId(branchRes.data[0].id);
        } catch (err) { console.error(err); }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/journals`, AUTH_HEADER);
            setEntries(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setEditingId(null);
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setLines([
            { tempId: '1', accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0 },
            { tempId: '2', accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0 },
        ]);
    };

    const handleAddNew = () => {
        resetForm();
        setView('form');
    };

    const handleEdit = (entry: any) => {
        setEditingId(entry.id);
        setDescription(entry.description);
        setDate(new Date(entry.date).toISOString().split('T')[0]);
        setBranchId(entry.branchId);
        setLines(entry.lines.map((l: any, idx: number) => ({
            id: l.id,
            tempId: (idx + 1).toString(),
            accountId: l.accountId,
            currencyId: l.currencyId,
            currencyCode: l.currency.code,
            debit: Number(l.debit),
            credit: Number(l.credit),
            exchangeRate: Number(l.exchangeRate),
            baseDebit: Number(l.baseDebit),
            baseCredit: Number(l.baseCredit)
        })));
        setView('form');
    };

    const addLine = () => {
        setLines([...lines, {
            tempId: Math.random().toString(36).substr(2, 9),
            accountId: '',
            currencyId: '',
            currencyCode: '---',
            debit: 0,
            credit: 0,
            exchangeRate: 1,
            baseDebit: 0,
            baseCredit: 0
        }]);
    };

    const removeLine = (tempId: string) => {
        if (lines.length > 2) {
            setLines(lines.filter(l => l.tempId !== tempId));
        }
    };

    const updateLine = (tempId: string, field: keyof JournalLine, value: any) => {
        setLines(lines.map(line => {
            if (line.tempId === tempId) {
                const updatedLine = { ...line, [field]: value };

                if (field === 'accountId') {
                    const acc = accounts.find(a => a.id === value);
                    if (acc) {
                        updatedLine.currencyId = acc.currencyId;
                        updatedLine.currencyCode = acc.currency.code;
                        updatedLine.exchangeRate = acc.currency.isBase ? 1 : line.exchangeRate;
                    }
                }

                if (field === 'debit' || field === 'exchangeRate' || field === 'accountId') {
                    updatedLine.baseDebit = Number(updatedLine.debit) * Number(updatedLine.exchangeRate);
                }
                if (field === 'credit' || field === 'exchangeRate' || field === 'accountId') {
                    updatedLine.baseCredit = Number(updatedLine.credit) * Number(updatedLine.exchangeRate);
                }

                return updatedLine;
            }
            return line;
        }));
    };

    const handleSave = async (isPost: boolean = false) => {
        if (!isBalanced) return toast.error('القيد غير متوازن بالعملة الأساسية');
        if (!branchId) return toast.error('يرجى اختيار الفرع');
        if (lines.some(l => !l.accountId)) return toast.error('يرجى اختيار الحساب لجميع الأسطر');

        setSaving(true);
        try {
            const payload = {
                branchId,
                description,
                date: new Date(date).toISOString(),
                lines: lines.map(l => ({
                    accountId: l.accountId,
                    currencyId: l.currencyId,
                    debit: Number(l.debit),
                    credit: Number(l.credit),
                    exchangeRate: Number(l.exchangeRate),
                    baseDebit: Number(l.baseDebit),
                    baseCredit: Number(l.baseCredit)
                }))
            };

            let res;
            if (editingId) {
                res = await axios.put(`${API_BASE}/journals/${editingId}`, payload, AUTH_HEADER);
            } else {
                res = await axios.post(`${API_BASE}/journals`, payload, AUTH_HEADER);
            }

            if (isPost) {
                await axios.post(`${API_BASE}/journals/${res.data.id || editingId}/post`, {}, AUTH_HEADER);
                toast.success('تم ترحيل القيد بنجاح');
            } else {
                toast.success('تم حفظ القيد بنجاح');
            }

            fetchEntries();
            setView('list');
            resetForm();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل في حفظ القيد');
        } finally {
            setSaving(false);
        }
    };

    const handleUnpost = async (id: string) => {
        if (!confirm('هل أنت متأكد من إلغاء ترحيل هذا القيد؟ سيعود القيد إلى حالة المسودة.')) return;
        try {
            await axios.post(`${API_BASE}/journals/${id}/unpost`, {}, AUTH_HEADER);
            toast.success('تم إلغاء ترحيل القيد بنجاح');
            fetchEntries();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل في إلغاء الترحيل');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا القيد؟')) return;
        try {
            await axios.delete(`${API_BASE}/journals/${id}`, AUTH_HEADER);
            toast.success('تم حذف القيد بنجاح');
            fetchEntries();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف');
        }
    };

    const totalBaseDebit = lines.reduce((sum, l) => sum + Number(l.baseDebit), 0);
    const totalBaseCredit = lines.reduce((sum, l) => sum + Number(l.baseCredit), 0);
    const isBalanced = Math.abs(totalBaseDebit - totalBaseCredit) < 0.001;

    if (loading && view === 'list') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold animate-pulse">جاري تحميل القيود اليومية...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={view === 'list' ? List : FilePlus2}
                    title={view === 'list' ? 'دفتر اليومية العامة' : (editingId ? 'تعديل قيد يومية' : 'إنشاء قيد محاسبي')}
                    description={view === 'list' ? 'استعرض وقم بإدارة كافة الحركات المالية المسجلة' : 'سجل التفاصيل بدقة وتأكد من توازن القيد بالعملة الأساسية'}
                    iconClassName={view === 'list' ? "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200"}
                />
                <div className="flex gap-3">
                    {view === 'list' ? (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all hover:-translate-y-0.5"
                        >
                            <Plus size={20} />
                            إضافة قيد جديد
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('list')}
                            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                        >
                            <ChevronLeft size={20} className="rotate-180" />
                            العودة للقائمة
                        </button>
                    )}
                </div>
            </div>

            {view === 'list' ? (
                <div className="space-y-6">
                    {/* Filters & Actions Bar */}
                    <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex gap-4 flex-1 max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="بحث برقم القيد أو الوصف..."
                                />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl hover:bg-white transition-all font-bold">
                                <Filter size={18} />
                                تصفية العرض
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl hover:bg-white hover:text-blue-600 transition-all">
                                <Printer size={20} />
                            </button>
                            <button className="p-2.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl hover:bg-white hover:text-emerald-600 transition-all">
                                <Download size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-slate-200/50">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-900 text-slate-300 font-black text-sm uppercase tracking-wider">
                                    <th className="py-5 px-6">رقم القيد</th>
                                    <th className="py-5 px-6">التاريخ</th>
                                    <th className="py-5 px-6">البيان / الوصف</th>
                                    <th className="py-5 px-6">الفرع</th>
                                    <th className="py-5 px-6 text-center w-32 border-r border-slate-800">الحالة</th>
                                    <th className="py-5 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <IconBox icon={List} className="bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors" boxSize="w-16 h-16" iconSize={32} />
                                                <p className="text-slate-400 font-bold">لا توجد قيود مسجلة حالياً</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-slate-50/80 transition-all group">
                                        <td className="py-4 px-6 font-black text-blue-600">
                                            <div className="bg-blue-50 w-fit px-3 py-1 rounded-lg">
                                                {entry.entryNumber}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-slate-500 text-sm">
                                            {new Date(entry.date).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-slate-800 line-clamp-1">{entry.description}</span>
                                        </td>
                                        <td className="py-4 px-6 italic text-slate-500 font-medium">
                                            {entry.branch?.name}
                                        </td>
                                        <td className="py-4 px-6 text-center border-r border-slate-100">
                                            <span className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest",
                                                entry.status === 'POSTED' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600 shadow-sm"
                                            )}>
                                                {entry.status === 'POSTED' ? <Check size={12} /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
                                                {entry.status === 'POSTED' ? 'رحّــــــــل' : 'مســــودة'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-left">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                                                    title="تعديل"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                {entry.status === 'POSTED' ? (
                                                    <button
                                                        onClick={() => handleUnpost(entry.id)}
                                                        className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                                                        title="إلغاء الترحيل (مدير فقط)"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        className="p-2 text-rose-500 hover:bg-rose-100 rounded-xl transition-all"
                                                        title="حذف"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-2xl shadow-blue-500/5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                                        <Building2 size={16} className="text-blue-500" />
                                        الفرع المحاسبي
                                    </label>
                                    <select
                                        value={branchId}
                                        onChange={(e) => setBranchId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                                        <Calendar size={16} className="text-blue-500" />
                                        تاريخ المعاملة
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                                        <FileText size={16} className="text-blue-500" />
                                        وصف الحركة
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="مثال: فاتورة مبيعات رقم..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-8">
                                <table className="w-full text-right border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50 italic text-slate-500 text-xs">
                                            <th className="py-4 px-8 border-b border-slate-100 font-bold">الحساب</th>
                                            <th className="py-4 px-2 border-b border-slate-100 font-bold text-center w-32">مدين</th>
                                            <th className="py-4 px-2 border-b border-slate-100 font-bold text-center w-32">دائن</th>
                                            <th className="py-4 px-2 border-b border-slate-100 font-bold text-center w-24">العملة</th>
                                            <th className="py-4 px-2 border-b border-slate-100 font-bold text-center w-32">سعر الصرف</th>
                                            <th className="py-4 px-8 border-b border-slate-100 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {lines.map((line) => (
                                            <tr key={line.tempId} className="group hover:bg-blue-50/20 transition-all">
                                                <td className="py-4 px-8">
                                                    <select
                                                        className="w-full bg-transparent border-0 border-b-2 border-slate-100 focus:border-blue-500 p-2 font-black outline-none transition-all"
                                                        value={line.accountId}
                                                        onChange={(e) => updateLine(line.tempId, 'accountId', e.target.value)}
                                                    >
                                                        <option value="">اختر الحساب...</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.code} | {acc.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="w-full bg-slate-100/30 p-2.5 rounded-xl text-center font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={line.debit > 0 ? line.debit : ''}
                                                        onChange={(e) => updateLine(line.tempId, 'debit', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="py-4 px-2">
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        className="w-full bg-slate-100/30 p-2.5 rounded-xl text-center font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                        value={line.credit > 0 ? line.credit : ''}
                                                        onChange={(e) => updateLine(line.tempId, 'credit', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="py-4 px-2 text-center">
                                                    <div className="inline-flex h-10 w-16 items-center justify-center bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-slate-200">
                                                        {line.currencyCode}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2">
                                                    <input
                                                        type="number"
                                                        step="0.000001"
                                                        disabled={line.currencyCode === 'SAR' || line.currencyCode === '---'}
                                                        className="w-full bg-slate-100 p-2.5 rounded-xl text-center font-mono font-bold disabled:opacity-30 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                                                        value={line.exchangeRate}
                                                        onChange={(e) => updateLine(line.tempId, 'exchangeRate', Number(e.target.value))}
                                                    />
                                                </td>
                                                <td className="py-4 px-8 text-left">
                                                    <button
                                                        onClick={() => removeLine(line.tempId)}
                                                        className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                onClick={addLine}
                                className="mt-8 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-black px-6 py-2.5 rounded-2xl hover:bg-blue-50 transition-all border-2 border-dashed border-blue-200"
                            >
                                <Plus size={20} />
                                إضافة سطر حساب جديد
                            </button>
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                <IconBox icon={ArrowLeftRight} className="bg-blue-500 shadow-blue-200" boxSize="w-10 h-10" iconSize={18} />
                                <h3 className="font-black text-slate-800">توازن القيد</h3>
                            </div>
                            <div className="space-y-5">
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase">المدين الكلي</span>
                                    <span className="font-mono font-black text-slate-800">{totalBaseDebit.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                    <span className="text-xs font-bold text-slate-500 uppercase">الدائن الكلي</span>
                                    <span className="font-mono font-black text-slate-800">{totalBaseCredit.toLocaleString()}</span>
                                </div>

                                <div className="pt-4 mt-2">
                                    <div className="flex flex-col gap-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">فرق التوازن (SAR)</span>
                                        <span className={cn(
                                            "font-black font-mono text-3xl transition-all tabular-nums",
                                            isBalanced ? "text-emerald-400" : "text-rose-400"
                                        )}>
                                            {(totalBaseDebit - totalBaseCredit).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {!isBalanced && (
                                    <div className="animate-bounce-subtle mt-4 flex items-start gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl text-[13px] font-bold border border-rose-100">
                                        <AlertCircle size={20} className="shrink-0" />
                                        <p>يرجى تعديل القيم ليتساوى المدين مع الدائن قبل المتابعة.</p>
                                    </div>
                                )}

                                {isBalanced && lines.length >= 2 && lines.some(l => l.accountId) && (
                                    <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[13px] font-bold border border-emerald-100 ring-4 ring-emerald-500/10">
                                        <Check size={20} className="shrink-0" />
                                        <p>القيد مالي متوازن وسليم محاسبياً</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2rem] text-white shadow-2xl border border-slate-800">
                            <div className="flex items-center gap-2 mb-6 text-blue-400">
                                <RefreshCw size={20} className="animate-spin-slow" />
                                <h3 className="font-black">الإجراءات النهائية</h3>
                            </div>
                            <div className="space-y-4">
                                <button
                                    disabled={saving || !description}
                                    onClick={() => handleSave(false)}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-black text-sm transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? 'جاري الاتصال بالسيرفر...' : 'حفظ التعديلات الحالية'}
                                </button>
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={!isBalanced || lines.some(l => !l.accountId) || saving || !description}
                                    className={cn(
                                        "w-full py-5 rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                                        isBalanced && !saving && description ? "bg-blue-600 hover:bg-blue-700 shadow-blue-900/40" : "bg-slate-700 text-slate-500 cursor-not-allowed"
                                    )}
                                >
                                    <Check size={20} />
                                    ترحيل القيد نهائياً
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JournalPage;
