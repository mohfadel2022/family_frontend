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
    Settings2,
    AlertTriangle,
    RotateCcw,
    CloudDownload,
    UploadCloud,
    History
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const SettingsPage = () => {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

    const [editingCurrency, setEditingCurrency] = useState<any>(null);
    const [editingBranch, setEditingBranch] = useState<any>(null);

    // Reset All state
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    // Backup & Restore
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    // History Modal
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyCurrency, setHistoryCurrency] = useState<any>(null);

    // Professional confirm dialog (shared)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string; description: string;
        variant: 'danger' | 'warning'; icon: any; label: string;
    }>({ title: '', description: '', variant: 'danger', icon: AlertTriangle, label: '' });
    const [confirmLoading, setConfirmLoading] = useState(false);

    const askConfirm = (cfg: typeof confirmConfig, action: () => Promise<void>) => {
        setConfirmConfig(cfg);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const executeConfirm = async () => {
        if (!confirmAction) return;
        setConfirmLoading(true);
        try { await confirmAction(); }
        finally { setConfirmLoading(false); setConfirmOpen(false); }
    };

    const fetchData = async () => {
        try {
            const [currRes, branchRes, userRes] = await Promise.all([
                axios.get(`${API_BASE}/currencies`, AUTH_HEADER),
                axios.get(`${API_BASE}/branches`, AUTH_HEADER),
                axios.get(`${API_BASE}/users`, AUTH_HEADER)
            ]);
            setCurrencies(Array.isArray(currRes.data) ? currRes.data : []);
            setBranches(Array.isArray(branchRes.data) ? branchRes.data : []);
            setUsers(Array.isArray(userRes.data) ? userRes.data : []);
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

    const handleDeleteCurrency = (id: string) => {
        askConfirm(
            {
                title: 'حذف العملة',
                description: 'هل أنت متأكد من حذف هذه العملة؟ قد تتأثر الحسابات والفروع المرتبطة بها.',
                variant: 'danger', icon: Trash2, label: 'حذف العملة',
            },
            async () => {
                await axios.delete(`${API_BASE}/currencies/${id}`, AUTH_HEADER);
                toast.success('تم حذف العملة بنجاح');
                fetchData();
            }
        );
    };

    const handleDeleteBranch = (id: string) => {
        askConfirm(
            {
                title: 'حذف الفرع',
                description: 'هل أنت متأكد من حذف هذا الفرع؟ قد يؤثر ذلك على القيود المحاسبية المرتبطة.',
                variant: 'danger', icon: Trash2, label: 'حذف الفرع',
            },
            async () => {
                await axios.delete(`${API_BASE}/branches/${id}`, AUTH_HEADER);
                toast.success('تم حذف الفرع بنجاح');
                fetchData();
            }
        );
    };

    const handleResetAll = async () => {
        if (resetConfirmText !== 'RESET') return;
        setIsResetting(true);
        try {
            await axios.delete(`${API_BASE}/reset-all`, AUTH_HEADER);
            toast.success('تم مسح جميع البيانات بنجاح. التطبيق جاهز للبداية من جديد.');
            setIsResetModalOpen(false);
            setResetConfirmText('');
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل إعادة الضبط');
        } finally {
            setIsResetting(false);
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const res = await axios.get(`${API_BASE}/backup`, { ...AUTH_HEADER, responseType: 'blob' });

            // Create a link and trigger download
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `family-fund-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('تم تحميل النسخة الاحتياطية بنجاح');
        } catch (err) {
            toast.error('فشل في تصدير النسخة الاحتياطية');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Store file ref, then confirm
        askConfirm(
            {
                title: 'استعادة النسخة الاحتياطية',
                description: 'تحذير: ستُحذف جميع البيانات الحالية وتُستبدل بالبيانات الموجودة في الملف المرفوع. هذه العملية لا يمكن التراجع عنها.',
                variant: 'warning', icon: UploadCloud, label: 'استعادة البيانات',
            },
            async () => {
                setIsRestoring(true);
                try {
                    const text = await file.text();
                    const jsonData = JSON.parse(text);
                    const res = await axios.post(`${API_BASE}/restore`, jsonData, AUTH_HEADER);
                    toast.success(res.data.message || 'تمت الاستعادة بنجاح');
                    window.location.reload();
                } catch {
                    toast.error('ملف غير صالح، تأكد أنه ملف JSON للنسخة الاحتياطية.');
                } finally {
                    setIsRestoring(false);
                }
            }
        );
        e.target.value = '';
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
            <PageHeader
                icon={Settings2}
                title="إعدادات النظام"
                description="System Configuration & Metadata"
                iconClassName="bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200"
            >
                <div className="flex items-center gap-3 bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100">
                    <ShieldCheck className="text-blue-600" size={20} />
                    <span className="text-blue-700 font-black text-sm">بيئة العمل مؤمنة بالكامل</span>
                </div>
            </PageHeader>

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
                        <Button
                            size="icon"
                            onClick={() => { setEditingBranch(null); setIsBranchModalOpen(true); }}
                            className="bg-slate-900 text-white w-12 h-12 rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-100 active:scale-90"
                        >
                            <Plus size={22} />
                        </Button>
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
                                        <h3 className="font-black text-slate-800 text-sm">{branch.name}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold mt-0.5">
                                            <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg font-mono">CODE: {branch.code}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-400 flex items-center gap-1">
                                                <Globe size={12} /> {branch.currency?.name} ({branch.currency?.code})
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => { setEditingBranch(branch); setIsBranchModalOpen(true); }}
                                        className="w-12 h-12 text-blue-500 bg-white border border-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit2 size={18} />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDeleteBranch(branch.id)}
                                        className="w-12 h-12 text-rose-500 bg-white border border-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
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
                        <Button
                            size="icon"
                            onClick={() => { setEditingCurrency(null); setIsCurrencyModalOpen(true); }}
                            className="bg-emerald-600 text-white w-12 h-12 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-90"
                        >
                            <Plus size={22} />
                        </Button>
                    </div>
                    <div className="p-4 space-y-3">
                        {currencies.map(curr => (
                            <div key={curr.id} className="p-5 rounded-3xl border border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/20 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-[1.25rem] border border-slate-100 flex items-center justify-center text-lg font-black text-slate-400 shadow-sm group-hover:text-emerald-500 group-hover:border-emerald-200 transition-all">
                                        {curr.symbol}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-black text-slate-800 text-sm">{curr.name}</h3>
                                            {curr.isBase && (
                                                <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Base</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold mt-0.5 text-slate-400">
                                            <span className="font-mono text-emerald-600">ISO: {curr.code}</span>
                                            <span className="text-slate-200">•</span>

                                            {curr.isBase
                                                ? 'العملة الأساسية (ميزان القياس)'
                                                : <span>
                                                    سعر الصرف:{" "}
                                                    <strong className="text-lg group-hover:text-emerald-500">
                                                        {Number(curr.exchangeRate).toLocaleString()}
                                                    </strong>{" "}
                                                    {currencies.find(c => c.isBase)?.name || ""}
                                                </span>
                                            }
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    {!curr.isBase && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => { setHistoryCurrency(curr); setIsHistoryModalOpen(true); }}
                                            className="w-10 h-10 text-blue-600 bg-white border border-blue-50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <History size={14} />
                                        </Button>
                                    )}
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => { setEditingCurrency(curr); setIsCurrencyModalOpen(true); }}
                                        className="w-10 h-10 text-emerald-600 bg-white border border-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Edit2 size={14} />
                                    </Button>
                                    {!curr.isBase && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeleteCurrency(curr.id)}
                                            className="w-10 h-10 text-rose-500 bg-white border border-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
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
                    users={users}
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

            {/* History Modal */}
            {isHistoryModalOpen && (
                <CurrencyHistoryModal
                    currency={historyCurrency}
                    onClose={() => setIsHistoryModalOpen(false)}
                />
            )}

            {/* Professional Confirm Dialog */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={executeConfirm}
                title={confirmConfig.title}
                description={confirmConfig.description}
                confirmLabel={confirmConfig.label}
                variant={confirmConfig.variant}
                icon={confirmConfig.icon}
                loading={confirmLoading}
            />

            {/* ─── Backup & Restore ─────────────────────────────────────────── */}
            <section className="bg-white rounded-[2.5rem] border border-blue-50 shadow-xl shadow-blue-500/5 overflow-hidden">
                <div className="p-8 border-b border-blue-50 bg-gradient-to-l from-blue-50/50 to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 border border-blue-200/50">
                            <CloudDownload size={26} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">حفظ واستعادة البيانات</h2>
                            <p className="text-sm font-semibold text-slate-500 mt-1">نسخ احتياطي لجميع بيانات النظام وأرصدة الحسابات</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">

                    {/* Backup Panel */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between items-start gap-4 hover:border-blue-100 hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CloudDownload size={20} className="text-blue-500" />
                                <h3 className="font-black text-slate-800">أخذ نسخة احتياطية</h3>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-slate-500">
                                سيتم تنزيل ملف <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">JSON</span> يحتوي على جميع فروعك، عملاتك، حساباتك، القيود المحاسبية للمستقبل. يمكنك الاحتفاظ بها واسترجاعها لاحقاً.
                            </p>
                        </div>
                        <Button
                            disabled={isBackingUp}
                            onClick={handleBackup}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 h-12"
                        >
                            {isBackingUp ? (
                                <><Loader2 size={18} className="mr-2 animate-spin" /> جاري التصدير...</>
                            ) : (
                                <><CloudDownload size={18} className="mr-2" /> تنزيل النسخة الاحتياطية</>
                            )}
                        </Button>
                    </div>

                    {/* Restore Panel */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between items-start gap-4 hover:border-indigo-100 hover:shadow-md transition-all">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <UploadCloud size={20} className="text-indigo-500" />
                                <h3 className="font-black text-slate-800">استعادة من نسخة احتياطية</h3>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-slate-500">
                                قم برفع ملف نسخة احتياطية سابق لاستعادة النظام. <strong className="text-rose-500">تنبيه: هذه العملية ستحذف كافة البيانات الحالية وتستبدلها ببيانات الملف.</strong>
                            </p>
                        </div>
                        <div className="w-full relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                disabled={isRestoring}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <Button
                                variant="outline"
                                disabled={isRestoring}
                                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl h-12 pointer-events-none"
                            >
                                {isRestoring ? (
                                    <><Loader2 size={18} className="mr-2 animate-spin" /> جاري الاستعادة...</>
                                ) : (
                                    <><UploadCloud size={18} className="mr-2" /> رفع واستعادة النظام</>
                                )}
                            </Button>
                        </div>
                    </div>

                </div>
            </section>

            {/* ─── Danger Zone ─────────────────────────────────────────── */}
            <section className="bg-white rounded-[2.5rem] border-2 border-rose-100 shadow-xl shadow-rose-100/30 overflow-hidden">
                <div className="p-8 border-b border-rose-50 bg-gradient-to-l from-rose-50/60 to-transparent flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 border border-rose-200/50">
                            <AlertTriangle size={26} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-rose-700">منطقة الخطر</h2>
                            <p className="text-xs text-rose-400 font-bold uppercase tracking-tighter">Danger Zone — Irreversible Actions</p>
                        </div>
                    </div>
                </div>
                <div className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-rose-50/50 rounded-3xl border border-rose-100">
                        <div>
                            <h3 className="font-black text-slate-800 text-base">مسح جميع البيانات وإعادة الضبط</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1 max-w-lg">
                                سيتم حذف جميع الحسابات، القيود، السندات، الفروع، العملات، الفترات المحاسبية، والمستخدمين غير المدراء. <br />
                                <strong className="text-rose-600">لا يمكن التراجع عن هذه العملية.</strong> حساب المدير (ADMIN) محفوظ دائماً.
                            </p>
                        </div>
                        <Button
                            onClick={() => { setResetConfirmText(''); setIsResetModalOpen(true); }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl px-8 h-12 shadow-lg shadow-rose-200 shrink-0 transition-all hover:shadow-rose-300 flex gap-2 items-center"
                        >
                            <RotateCcw size={16} />
                            إعادة ضبط التطبيق
                        </Button>
                    </div>
                </div>
            </section>

            {/* ─── Reset Confirm Modal ──────────────────────────────────── */}
            {isResetModalOpen && (
                <Dialog open={true} onOpenChange={(open) => !open && setIsResetModalOpen(false)}>
                    <DialogContent className="max-w-md bg-white p-0 overflow-hidden border-rose-100 rounded-[2.5rem]" dir="rtl">
                        <DialogHeader className="p-8 bg-gradient-to-br from-rose-50 to-white border-b border-rose-100 flex flex-row justify-between items-center text-right space-y-0">
                            <div>
                                <DialogTitle className="text-2xl font-black text-rose-700">تأكيد إعادة الضبط</DialogTitle>
                                <p className="text-rose-400 font-bold text-sm tracking-tight uppercase mt-1">Irreversible — Confirm to Proceed</p>
                            </div>
                            <div className="p-4 bg-rose-100 rounded-2xl border border-rose-200 mr-auto">
                                <AlertTriangle className="text-rose-600" size={24} />
                            </div>
                        </DialogHeader>
                        <div className="p-8 space-y-6">
                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-700 font-bold leading-relaxed">
                                ⚠️ ستفقد بشكل دائم: الحسابات، القيود اليومية، السندات، الفروع، العملات، الفترات المحاسبية، والمستخدمين (ما عدا المدير).
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700">
                                    اكتب <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">RESET</span> للتأكيد
                                </label>
                                <Input
                                    placeholder="RESET"
                                    className="h-12 font-mono font-black border-rose-200 focus-visible:ring-rose-500 bg-rose-50/30 text-center text-lg tracking-widest"
                                    value={resetConfirmText}
                                    onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsResetModalOpen(false)}
                                    className="flex-1 h-12 rounded-xl border-slate-200 font-black"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    disabled={resetConfirmText !== 'RESET' || isResetting}
                                    onClick={handleResetAll}
                                    className="flex-[2] h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black disabled:opacity-40 transition-all shadow-lg shadow-rose-100"
                                >
                                    {isResetting ? <Loader2 size={18} className="animate-spin ml-2" /> : <RotateCcw size={18} className="ml-2" />}
                                    {isResetting ? 'جاري المسح...' : 'تأكيد المسح الكامل'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
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
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-blue-50 to-white border-b border-slate-100 flex flex-row justify-between items-center text-right space-y-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900">{branch ? 'تعديل بيانات الفرع' : 'إضافة فرع جديد'}</DialogTitle>
                        <p className="text-slate-400 font-bold text-sm tracking-tight uppercase mt-1">Organizational Sub-Unit Registry</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mr-auto">
                        <Building2 className="text-blue-600" size={24} />
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم الفرع الكامل</label>
                            <Input
                                required
                                placeholder="مثال: المركز الرئيسي"
                                className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 outline-none transition-all font-bold text-sm"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-700 mr-1">عملة الفرع الأساسية</label>
                                <Select value={formData.currencyId} onValueChange={(v) => setFormData({ ...formData, currencyId: v })}>
                                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold transition-all text-right" dir="rtl">
                                        <SelectValue placeholder="اختر العملة" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        {currencies.map((curr: any) => (
                                            <SelectItem key={curr.id} value={curr.id}>{curr.name} ({curr.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-sm font-black text-slate-700 mr-1">كود الفرع المختصر</label>
                                <Input
                                    required
                                    placeholder="مثال: HQ"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500 transition-all font-mono font-bold text-sm uppercase text-right"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        {/* Removed redundant fields */}
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-xl border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs">إلغاء</Button>
                        <Button disabled={loading} type="submit" className="flex-[2] h-14 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                            {loading ? <Loader2 size={24} className="animate-spin mr-2" /> : 'حفظ بيانات الفرع'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const CurrencyModal = ({ currency, onClose, onSave }: any) => {
    const [formData, setFormData] = useState(currency || { name: '', code: '', symbol: '', isBase: false, exchangeRate: 1 });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                symbol: formData.symbol,
                isBase: formData.isBase,
                exchangeRate: Number(formData.exchangeRate)
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
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-emerald-50 to-white border-b border-slate-100 flex flex-row justify-between items-center text-right space-y-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900">{currency ? 'تعديل العملة' : 'إضافة عملة نظام'}</DialogTitle>
                        <p className="text-slate-400 font-bold text-sm tracking-tight uppercase mt-1">ISO Monetary Standards Mapping</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mr-auto">
                        <Coins className="text-emerald-600" size={24} />
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-slate-700 mr-1">اسم العملة الرسمي</label>
                            <Input
                                required
                                placeholder="مثال: يورو"
                                className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 outline-none transition-all font-bold text-sm"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">الكود الدولي (ISO)</label>
                                <Input
                                    required
                                    placeholder="EUR"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 outline-none transition-all font-mono font-bold text-sm"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 mr-1">الرمز (Symbol)</label>
                                <Input
                                    required
                                    placeholder="€"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 outline-none transition-all font-bold text-center text-sm"
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

                        {!formData.isBase && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-sm font-black text-slate-700 mr-1 flex items-center gap-2">
                                    سعر الصرف (مقابل العملة الأساسية)
                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Exchange Rate</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.000001"
                                    required
                                    placeholder="1.00"
                                    className="w-full px-5 h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500 outline-none transition-all font-mono font-bold text-sm"
                                    value={formData.exchangeRate}
                                    onChange={e => setFormData({ ...formData, exchangeRate: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mr-2 font-medium">كم تساوي هذه العملة مقابل 1 من العملة الأساسية</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-6">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-14 rounded-xl border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs">إلغاء</Button>
                        <Button disabled={loading} type="submit" className="flex-[2] h-14 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all">
                            {loading ? <Loader2 size={24} className="animate-spin mr-2" /> : 'اعتماد العملة'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const CurrencyHistoryModal = ({ currency, onClose }: any) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editDate, setEditDate] = useState<string>('');

    const fetchHistory = async () => {
        if (!currency) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/currencies/${currency.id}/history`, AUTH_HEADER);
            setHistory(res.data);
        } catch (err) {
            toast.error('فشل تحميل سجل الأسعار');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [currency?.id]);

    const handleEdit = (rec: any) => {
        setEditingId(rec.id);
        setEditValue(rec.rate.toString());
        // ISO date string → YYYY-MM-DD for the date input
        setEditDate(new Date(rec.date).toISOString().split('T')[0]);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editValue || !editDate) return toast.error('يرجى تعبئة السعر والتاريخ');
        try {
            await axios.put(
                `${API_BASE}/currencies/history/${id}`,
                { rate: Number(editValue), date: new Date(editDate).toISOString() },
                AUTH_HEADER
            );
            toast.success('تم تحديث السجل بنجاح');
            setEditingId(null);
            fetchHistory();
        } catch (err) {
            toast.error('فشل تحديث السجل');
        }
    };

    const handleDelete = (id: string) => {
        setPendingDeleteId(id);
        setConfirmOpen(true);
    };

    const executeDelete = async () => {
        if (!pendingDeleteId) return;
        setDeleteLoading(true);
        try {
            await axios.delete(`${API_BASE}/currencies/history/${pendingDeleteId}`, AUTH_HEADER);
            toast.success('تم حذف السجل بنجاح');
            fetchHistory();
        } catch (err) {
            toast.error('فشل حذف السجل');
        } finally {
            setDeleteLoading(false);
            setConfirmOpen(false);
            setPendingDeleteId(null);
        }
    };

    if (!currency) return null;

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                <DialogHeader className="p-8 bg-gradient-to-br from-blue-50 to-white border-b border-slate-100 flex flex-row justify-between items-center text-right space-y-0">
                    <div>
                        <DialogTitle className="text-2xl font-black text-slate-900">سجل أسعار الصرف: {currency.name}</DialogTitle>
                        <p className="text-slate-400 font-bold text-sm tracking-tight uppercase mt-1">Historical Exchange Rate Logs</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mr-auto">
                        <History className="text-blue-600" size={24} />
                    </div>
                </DialogHeader>

                <div className="p-8">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 size={32} className="animate-spin text-blue-600" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-black">لا يوجد سجل تاريخي لهذه العملة</div>
                    ) : (
                        <div className="border border-slate-100 rounded-3xl overflow-hidden max-h-[420px] overflow-y-auto shadow-sm">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4">تاريخ السعر</th>
                                        <th className="p-4">سعر الصرف</th>
                                        <th className="p-4">تاريخ التسجيل</th>
                                        <th className="p-4 text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map((h: any) => {
                                        const isEditing = editingId === h.id;
                                        return (
                                            <tr key={h.id} className={cn(
                                                "transition-colors group",
                                                isEditing ? "bg-blue-50/40" : "hover:bg-blue-50/20"
                                            )}>
                                                {/* Date column */}
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <Input
                                                            type="date"
                                                            value={editDate}
                                                            onChange={(e) => setEditDate(e.target.value)}
                                                            className="h-8 w-36 font-mono font-bold border-blue-200 text-xs"
                                                        />
                                                    ) : (
                                                        <span className="font-mono font-bold text-slate-600 text-xs">
                                                            {new Date(h.date).toLocaleDateString('ar-DZ')}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Rate column */}
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                step="0.000001"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                className="h-8 w-28 font-mono font-black border-blue-200 text-xs"
                                                                autoFocus
                                                            />
                                                            <Button
                                                                size="icon"
                                                                className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600 flex-shrink-0"
                                                                onClick={() => handleSaveEdit(h.id)}
                                                                title="حفظ"
                                                            >
                                                                <Check size={14} />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-rose-500 flex-shrink-0"
                                                                onClick={() => setEditingId(null)}
                                                                title="إلغاء"
                                                            >
                                                                <X size={14} />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono font-black text-blue-700">
                                                            {Number(h.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Created at column */}
                                                <td className="p-4 text-[10px] font-bold text-slate-400 uppercase">
                                                    {new Date(h.createdAt).toLocaleString('ar-DZ')}
                                                </td>

                                                {/* Actions column */}
                                                <td className="p-4">
                                                    {!isEditing && (
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                size="icon" variant="ghost"
                                                                className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                                onClick={() => handleEdit(h)}
                                                                title="تعديل السعر والتاريخ"
                                                            >
                                                                <Edit2 size={14} />
                                                            </Button>
                                                            <Button
                                                                size="icon" variant="ghost"
                                                                className="h-8 w-8 text-rose-500 hover:bg-rose-50"
                                                                onClick={() => handleDelete(h.id)}
                                                                title="حذف السجل"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex gap-4 pt-8">
                        <Button type="button" variant="outline" onClick={onClose} className="w-full h-14 rounded-xl border-slate-200 font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs">إغلاق</Button>
                    </div>
                </div>
            </DialogContent>

            {/* Inline confirm for history row delete */}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={executeDelete}
                title="حذف سجل السعر"
                description="هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذه العملية."
                confirmLabel="حذف السجل"
                variant="danger"
                icon={Trash2}
                loading={deleteLoading}
            />
        </Dialog>
    );
};

export default SettingsPage;
