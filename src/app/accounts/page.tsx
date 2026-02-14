"use client";

import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    Folder,
    FileText,
    Plus,
    Loader2,
    Edit2,
    Trash2,
    Search,
    Filter,
    ArrowDownRight,
    Library
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';

const AccountItem = ({ id, name, code, type, balance, currency, children, onEdit, onDelete }: any) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = children && React.Children.count(children) > 0;

    return (
        <div className="select-none animate-in fade-in slide-in-from-right duration-300">
            <div
                className={cn(
                    "flex items-center gap-4 p-1 rounded-2xl group cursor-pointer transition-all border border-transparent",
                    hasChildren ? "hover:bg-blue-50/30" : "hover:bg-slate-100/50"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                        {hasChildren ? (
                            <div className={cn("transition-transform duration-300", isExpanded ? "rotate-0" : "-rotate-90")}>
                                <ChevronDown size={16} className="text-slate-400 group-hover:text-blue-500" />
                            </div>
                        ) : <div className="w-4" />}
                    </div>

                    <IconBox
                        icon={hasChildren ? Folder : FileText}
                        className={hasChildren ? "bg-blue-100 text-blue-600 shadow-blue-50" : "bg-slate-100 text-slate-400 shadow-none"}
                        boxSize="w-8 h-8"
                        iconSize={14}
                    />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg">{code}</span>
                            <span className="font-black text-sm text-slate-800 tracking-tight">{name}</span>
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest mt-0.5",
                            type === 'ASSET' ? "text-blue-500" :
                                type === 'REVENUE' ? "text-emerald-500" :
                                    type === 'EXPENSE' ? "text-rose-500" :
                                        "text-slate-400"
                        )}>{type}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right flex flex-col items-end">
                        <span className="font-mono font-black text-slate-900 text-lg tabular-nums">
                            {balance?.toLocaleString() || '0.00'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{currency}</span>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-blue-100"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-transparent hover:border-rose-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
            {hasChildren && isExpanded && (
                <div className="mr-12 border-r-2 border-slate-100 pr-4 mt-2 mb-4 space-y-2 relative">
                    <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-b from-transparent via-slate-50/50 to-transparent"></div>
                    {children}
                </div>
            )}
        </div>
    );
};

const AccountsPage = () => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [accRes, currRes, branchRes] = await Promise.all([
                axios.get('http://localhost:4000/api/meta/accounts', { headers: { Authorization: 'Bearer mock-token' } }),
                axios.get('http://localhost:4000/api/meta/', { headers: { Authorization: 'Bearer mock-token' } }),
                axios.get('http://localhost:4000/api/meta/branches', { headers: { Authorization: 'Bearer mock-token' } })
            ]);
            setAccounts(accRes.data);
            setCurrencies(currRes.data);
            setBranches(branchRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;
        try {
            await axios.delete(`http://localhost:4000/api/meta/accounts/${id}`, {
                headers: { Authorization: 'Bearer mock-token' }
            });
            toast.success('تم حذف الحساب بنجاح');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحذف');
        }
    };

    const buildTree = (parentId: string | null = null) => {
        return accounts
            .filter(a => a.parentId === parentId)
            .map(a => (
                <AccountItem
                    key={a.id}
                    id={a.id}
                    name={a.name}
                    code={a.code}
                    type={a.type}
                    balance={0}
                    currency={a.currency.code}
                    onEdit={() => { setEditingAccount(a); setIsModalOpen(true); }}
                    onDelete={() => handleDelete(a.id)}
                >
                    {buildTree(a.id)}
                </AccountItem>
            ));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader
                    icon={Library}
                    title="شجرة الحسابات"
                    description="Chart of Accounts Management"
                    iconClassName="bg-gradient-to-br from-indigo-600 to-blue-600 shadow-blue-200"
                    iconSize={24}
                />
                <button
                    onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}
                    className="group relative flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black transition-all hover:bg-black hover:-translate-y-0.5 active:translate-y-0 shadow-xl shadow-slate-200 text-xs"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    إضافة حساب جديد
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats & Tools */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                        <div className="relative mb-6">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold placeholder:text-slate-300"
                                placeholder="ابحث عن حساب..."
                            />
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mr-2">إحصائيات الشجرة</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                    <div className="text-blue-600 font-black text-2xl">{accounts.length}</div>
                                    <div className="text-[10px] font-black text-blue-400 uppercase">إجمالي الحسابات</div>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="text-emerald-600 font-black text-2xl">{accounts.filter(a => !a.parentId).length}</div>
                                    <div className="text-[10px] font-black text-emerald-400 uppercase">رئيسية</div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white overflow-hidden relative group">
                            <ArrowDownRight size={80} className="absolute -bottom-6 -left-6 opacity-10 group-hover:scale-110 transition-transform" />
                            <h5 className="font-black text-lg mb-2">هيكلة ذكية</h5>
                            <p className="text-xs text-blue-100 font-bold leading-relaxed">
                                قم بتنظيم حساباتك في مستويات غير محدودة. الحسابات الرئيسية (Folders) تجمع أرصدة الحسابات الفرعية تلقائياً.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tree View */}
                <div className="lg:col-span-3">
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 shadow-2xl min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20 gap-4">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-black animate-pulse">جاري بناء معمارية الحسابات...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {accounts.length > 0 ? buildTree(null) : (
                                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                                        <IconBox icon={Library} className="bg-slate-100 text-slate-300" boxSize="w-20 h-20" iconSize={40} />
                                        <div className="text-center">
                                            <p className="font-black text-xl text-slate-400">لا توجد حسابات مسجلة حالياً</p>
                                            <p className="text-slate-300 text-xs font-bold mt-1">ابدأ بإضافة أول حساب لشجرتك المحاسبية</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <AccountModal
                    account={editingAccount}
                    accounts={accounts}
                    currencies={currencies}
                    branches={branches}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                />
            )}
        </div>
    );
};

const AccountModal = ({ account, accounts, currencies, branches, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(account || {
        name: '',
        code: '',
        type: 'ASSET',
        currencyId: currencies[0]?.id,
        branchId: branches[0]?.id,
        parentId: null
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                type: formData.type,
                currencyId: formData.currencyId,
                branchId: formData.branchId,
                parentId: (formData.parentId === 'null' || !formData.parentId) ? null : formData.parentId
            };

            const headers = { Authorization: 'Bearer mock-token' };
            if (account) {
                await axios.put(`http://localhost:4000/api/meta/accounts/${account.id}`, payload, { headers });
            } else {
                await axios.post('http://localhost:4000/api/meta/accounts', payload, { headers });
            }
            onSave();
            onClose();
            toast.success(account ? 'تم تحديث الحساب بنجاح' : 'تم إضافة الحساب بنجاح');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحفظ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-3xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                    <PageHeader
                        icon={FileText}
                        title={account ? 'تعديل بيانات الحساب' : 'إضافة حساب مالي'}
                        description="Account Structure Definition"
                        iconClassName="bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200"
                        iconSize={24}
                    />
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم الحساب الكامل</label>
                            <input
                                required
                                placeholder="مثال: مصرف الراجحي - الحساب الجاري"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">كود الحساب (فريد)</label>
                            <input
                                required
                                placeholder="101001"
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-mono font-bold"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">نوع الحساب</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="ASSET">أصل (Asset)</option>
                                <option value="LIABILITY">التزام (Liability)</option>
                                <option value="EQUITY">حقوق ملكية (Equity)</option>
                                <option value="REVENUE">إيراد (Revenue)</option>
                                <option value="EXPENSE">مصروف (Expense)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">العملة الأساسية</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                                value={formData.currencyId}
                                onChange={e => setFormData({ ...formData, currencyId: e.target.value })}
                            >
                                {currencies.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">الفرع المحاسبي</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                                value={formData.branchId}
                                onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                            >
                                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1 underline decoration-blue-200 decoration-4">تبعية الحساب في الشجرة (Parent)</label>
                            <select
                                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-bold appearance-none cursor-pointer"
                                value={formData.parentId || 'null'}
                                onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                            >
                                <option value="null">-- بدون (هذا حساب مستوى أول / Parent Root) --</option>
                                {accounts.filter((a: any) => a.id !== account?.id).map((a: any) => (
                                    <option key={a.id} value={a.id}>{a.code} | {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-5 rounded-2xl border border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs"
                        >
                            إلغاء الأمر
                        </button>
                        <button
                            disabled={loading}
                            type="submit"
                            className="flex-[2] px-4 py-5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : 'اعتماد وحفظ الحساب'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AccountsPage;
