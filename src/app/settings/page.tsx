"use client";

import React, { useState, useEffect } from 'react';
import {
    Globe,
    Plus,
    Trash2,
    Edit2,
    Building2,
    Coins,
    Loader2,
    Check,
    X,
    ShieldCheck,
    Briefcase,
    Settings2
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';

const API_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

const SettingsPage = () => {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

    const [editingCurrency, setEditingCurrency] = useState<any>(null);
    const [editingBranch, setEditingBranch] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [currRes, branchRes] = await Promise.all([
                axios.get(`${API_BASE}/`, AUTH_HEADER),
                axios.get(`${API_BASE}/branches`, AUTH_HEADER)
            ]);
            setCurrencies(Array.isArray(currRes.data) ? currRes.data : []);
            setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
        } catch (err) {
            console.error("Failed to fetch settings:", err);
            toast.error("فشل تحميل البيانات من الخادم");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDeleteCurrency = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه العملة؟')) return;
        try {
            await axios.delete(`${API_BASE}/currencies/${id}`, AUTH_HEADER);
            toast.success('تم حذف العملة بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف. قد تكون العملة مرتبطة بحسابات أو فروع.');
        }
    };

    const handleDeleteBranch = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
        try {
            await axios.delete(`${API_BASE}/branches/${id}`, AUTH_HEADER);
            toast.success('تم حذف الفرع بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف. قد يكون الفرع مرتبط بقيود محاسبية.');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تحميل الإعدادات والتفضيلات...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={Settings2}
                    title="إعدادات النظام"
                    description="System Configuration & Metadata"
                    iconClassName="bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200"
                />
                <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100">
                    <ShieldCheck className="text-blue-600" size={20} />
                    <span className="text-blue-700 font-black text-sm">بيئة العمل مؤمنة بالكامل</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Branches Section */}
                <section className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden transition-all hover:shadow-2xl">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-l from-slate-50/50 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 shadow-sm border border-blue-200/50 group-hover:scale-110 transition-transform">
                                <Building2 size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">إدارة الفروع</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Organizational Units</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setEditingBranch(null); setIsBranchModalOpen(true); }}
                            className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-100 active:scale-90"
                        >
                            <Plus size={22} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        {branches.length === 0 ? (
                            <div className="p-12 text-center opacity-20 flex flex-col items-center gap-3">
                                <Briefcase size={48} />
                                <p className="font-black">لا توجد فروع مسجلة</p>
                            </div>
                        ) : branches.map(branch => (
                            <div key={branch.id} className="p-5 rounded-3xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/20 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 font-black shadow-sm group-hover:text-blue-500 group-hover:border-blue-200 transition-all">
                                        {branch.code?.substring(0, 2) || 'BR'}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-lg">{branch.name}</h3>
                                        <div className="flex items-center gap-3 text-xs font-bold mt-0.5">
                                            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg font-mono">CODE: {branch.code}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <Globe size={12} /> {branch.currency?.name} ({branch.currency?.code})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => { setEditingBranch(branch); setIsBranchModalOpen(true); }}
                                        className="p-3 text-blue-500 bg-white border border-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBranch(branch.id)}
                                        className="p-3 text-rose-500 bg-white border border-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Currencies Section */}
                <section className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden transition-all hover:shadow-2xl">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm border border-emerald-200/50 group-hover:scale-110 transition-transform">
                                <Coins size={26} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-800">إدارة العملات</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Monetary Units</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setEditingCurrency(null); setIsCurrencyModalOpen(true); }}
                            className="bg-emerald-600 text-white p-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-90"
                        >
                            <Plus size={22} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        {currencies.map(curr => (
                            <div key={curr.id} className="p-5 rounded-3xl border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/20 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white rounded-[1.25rem] border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 shadow-sm group-hover:text-emerald-500 group-hover:border-emerald-200 transition-all">
                                        {curr.symbol}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-slate-800 text-lg">{curr.name}</h3>
                                            {curr.isBase && (
                                                <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Base</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-bold mt-0.5 text-slate-400">
                                            <span className="font-mono text-emerald-600">ISO: {curr.code}</span>
                                            <span className="text-slate-200">•</span>
                                            <span>نظام التشفير: Unicode</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <button
                                        onClick={() => { setEditingCurrency(curr); setIsCurrencyModalOpen(true); }}
                                        className="p-3 text-emerald-600 bg-white border border-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    {!curr.isBase && (
                                        <button
                                            onClick={() => handleDeleteCurrency(curr.id)}
                                            className="p-3 text-rose-500 bg-white border border-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Branch Modal */}
            {isBranchModalOpen && (
                <BranchModal
                    branch={editingBranch}
                    currencies={currencies}
                    onClose={() => setIsBranchModalOpen(false)}
                    onSave={fetchData}
                />
            )}

            {/* Currency Modal */}
            {isCurrencyModalOpen && (
                <CurrencyModal
                    currency={editingCurrency}
                    onClose={() => setIsCurrencyModalOpen(false)}
                    onSave={fetchData}
                />
            )}
        </div>
    );
};

const BranchModal = ({ branch, currencies, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(branch || {
        name: '',
        code: '',
        currencyId: currencies && currencies.length > 0 ? currencies[0].id : ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                currencyId: formData.currencyId
            };
            if (branch) {
                await axios.put(`${API_BASE}/branches/${branch.id}`, payload, AUTH_HEADER);
            } else {
                await axios.post(`${API_BASE}/branches`, payload, AUTH_HEADER);
            }
            onSave();
            onClose();
            toast.success('تم حفظ بيانات الفرع بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حفظ الفرع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-3xl border border-white overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-blue-50 to-white border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">{branch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</h3>
                        <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">Organizational Sub-Unit Registry</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Building2 className="text-blue-600" size={24} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم الفرع الكامل</label>
                            <input
                                required
                                placeholder="مثال: المركز الرئيسي"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">كود الفرع (Unique)</label>
                                <input
                                    required
                                    placeholder="MAIN"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono font-bold"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">العملة الافتراضية</label>
                                <select
                                    required
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold cursor-pointer appearance-none"
                                    value={formData.currencyId}
                                    onChange={e => setFormData({ ...formData, currencyId: e.target.value })}
                                >
                                    {currencies.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-5 rounded-2xl border border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs">إلغاء</button>
                        <button disabled={loading} type="submit" className="flex-[2] px-4 py-5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={24} className="animate-spin" /> : 'حفظ بيانات الفرع'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const CurrencyModal = ({ currency, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(currency || { name: '', code: '', symbol: '', isBase: false });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                symbol: formData.symbol,
                isBase: formData.isBase
            };
            if (currency) {
                await axios.put(`${API_BASE}/currencies/${currency.id}`, payload, AUTH_HEADER);
            } else {
                await axios.post(`${API_BASE}/currencies`, payload, AUTH_HEADER);
            }
            onSave();
            onClose();
            toast.success('تم حفظ بيانات العملة بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حفظ العملة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-3xl border border-white overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-emerald-50 to-white border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">{currency ? 'تعديل العملة' : 'إضافة عملة نظام'}</h3>
                        <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">ISO Monetary Standards Mapping</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <Coins className="text-emerald-600" size={24} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم العملة الرسمي</label>
                            <input
                                required
                                placeholder="مثال: يورو"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">الكود الدولي (ISO)</label>
                                <input
                                    required
                                    placeholder="EUR"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono font-bold"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">الرمز (Symbol)</label>
                                <input
                                    required
                                    placeholder="€"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-center"
                                    value={formData.symbol}
                                    onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 group cursor-pointer" onClick={() => setFormData({ ...formData, isBase: !formData.isBase })}>
                            <div className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                                formData.isBase ? "bg-emerald-600 border-emerald-600" : "bg-white border-slate-200"
                            )}>
                                {formData.isBase && <Check size={16} className="text-white" />}
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-800">تعيين كعملة أساسية للنظام</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System-wide transactional base</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-5 rounded-2xl border border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs">إلغاء</button>
                        <button disabled={loading} type="submit" className="flex-[2] px-4 py-5 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={24} className="animate-spin" /> : 'اعتماد العملة'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsPage;
