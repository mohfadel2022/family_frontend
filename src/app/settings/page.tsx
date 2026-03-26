"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { toast } from 'sonner';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ActionModal } from '@/components/ui/ActionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { UnauthorizedAccess } from '@/components/ui/UnauthorizedAccess';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';

import { META_BASE, getAuthHeader } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';

const API_BASE = META_BASE;

const SettingsPage = () => {
    const theme_page = usePageTheme();
    const { user, checkPermission, loading: authLoading } = useAuth();
    const { theme, setTheme } = useTheme();
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
    const [restorePreviewData, setRestorePreviewData] = useState<any>(null);
    const [isRestorePreviewOpen, setIsRestorePreviewOpen] = useState(false);
    const [pendingRestoreFile, setPendingRestoreFile] = useState<any>(null);

    // History Modal
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyCurrency, setHistoryCurrency] = useState<any>(null);

    // System Config & Backup Scheduler
    const [systemConfig, setSystemConfig] = useState<any>(null);
    const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);

    // Restore Progress
    const [isRestoreResultOpen, setIsRestoreResultOpen] = useState(false);
    const [restoreProgressStep, setRestoreProgressStep] = useState(0);
    const [restoreStatus, setRestoreStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [restoreErrorMessage, setRestoreErrorMessage] = useState('');

    // Professional confirm dialog (shared)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string; description: string;
        variant: 'danger' | 'warning'; icon: any; label: string;
    }>({ title: '', description: '', variant: 'danger', icon: APP_ICONS.STATE.WARNING, label: '' });
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

    const isAdmin = user?.role === 'ADMIN';
    const canManageSystem = checkPermission('CURRENCIES_VIEW') && checkPermission('ENTITIES_VIEW');

    const fetchData = async () => {
        try {
            setLoading(true);
            const auth = getAuthHeader();
            const requests: Promise<any>[] = [];

            if (canManageSystem) {
                requests.push(axios.get(`${API_BASE}/currencies`, auth));
                requests.push(axios.get(`${API_BASE}/branches`, auth));
            }

            if (checkPermission('USERS_VIEW')) {
                requests.push(axios.get(`${API_BASE}/users`, auth));
            }

            // Always fetch system config if logged in
            requests.push(axios.get(`${API_BASE}/system-config`, auth));

            if (requests.length > 0) {
                const results = await Promise.allSettled(requests);
                let idx = 0;

                if (canManageSystem) {
                    const currRes = results[idx++];
                    setCurrencies(currRes.status === 'fulfilled' && Array.isArray(currRes.value?.data) ? currRes.value.data : []);

                    const branchRes = results[idx++];
                    setBranches(branchRes.status === 'fulfilled' && Array.isArray(branchRes.value?.data) ? branchRes.value.data : []);
                }

                if (checkPermission('USERS_VIEW')) {
                    const userRes = results[idx++];
                    setUsers(userRes.status === 'fulfilled' && Array.isArray(userRes.value?.data) ? userRes.value.data : []);
                }

                const configRes = results[idx++];
                if (configRes.status === 'fulfilled') {
                    setSystemConfig(configRes.value.data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Handle scroll to hash after data is loaded and dynamically
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#backup-section') {
                const element = document.getElementById('backup-section');
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                }
            }
        };

        if (!loading) {
            handleHashChange();
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [loading]);

    const handleDeleteCurrency = (id: string) => {
        askConfirm(
            {
                title: 'حذف العملة',
                description: 'هل أنت متأكد من حذف هذه العملة؟ قد تتأثر الحسابات والفروع المرتبطة بها.',
                variant: 'danger', icon: APP_ICONS.ACTIONS.DELETE, label: 'حذف العملة',
            },
            async () => {
                await axios.delete(`${API_BASE}/currencies/${id}`, getAuthHeader());
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
                variant: 'danger', icon: APP_ICONS.ACTIONS.DELETE, label: 'حذف الفرع',
            },
            async () => {
                await axios.delete(`${API_BASE}/branches/${id}`, getAuthHeader());
                toast.success('تم حذف الفرع بنجاح');
                fetchData();
            }
        );
    };

    const handleResetAll = async () => {
        if (resetConfirmText !== 'RESET') return;
        setIsResetting(true);
        try {
            await axios.delete(`${API_BASE}/reset-all`, getAuthHeader());
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
            const res = await axios.get(`${API_BASE}/backup`, { ...getAuthHeader(), responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `family-fund-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('تم تحميل النسخة الاحتياطية بنجاح');
            fetchData();
            // Notify Header to refresh system config (dismiss overdue notification)
            window.dispatchEvent(new CustomEvent('backup-success'));
        } catch (err) {
            toast.error('فشل في تصدير النسخة الاحتياطية');
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestoreFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);
            setPendingRestoreFile(jsonData);

            // Get preview from backend
            const res = await axios.post(`${API_BASE}/restore-preview`, { data: jsonData }, getAuthHeader());
            setRestorePreviewData(res.data);
            setIsRestorePreviewOpen(true);
        } catch (err: any) {
            toast.error('ملف غير صالح أو تالف.');
        }
        e.target.value = '';
    };

    const handleConfirmRestore = async () => {
        if (!pendingRestoreFile) return;
        setIsRestorePreviewOpen(false);
        setIsRestoreResultOpen(true);
        setRestoreStatus('loading');
        setRestoreProgressStep(1); // Starting: Cleaning

        try {
            // Fake progress delay for UX transparency
            const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

            await delay(800);
            setRestoreProgressStep(2); // RBAC
            await delay(600);
            setRestoreProgressStep(3); // Core Data
            await delay(600);
            setRestoreProgressStep(4); // Financials & Subs

            const res = await axios.post(`${API_BASE}/restore`, { data: pendingRestoreFile }, getAuthHeader());

            setRestoreProgressStep(5); // Finalizing
            await delay(500);

            setRestoreStatus('success');
        } catch (err: any) {
            console.error("RESTORE ERROR DETAIL:", err);
            let msg = 'حدث خطأ غير متوقع أثناء الاستعادة.';
            
            if (err.response?.data) {
                const data = err.response.data;
                msg = data.error || data.message || (typeof data === 'string' ? data : msg);
            } else if (err.message) {
                msg = err.message;
            }
            
            setRestoreStatus('error');
            setRestoreErrorMessage(msg);
        } finally {
            setPendingRestoreFile(null);
        }
    };

    const handleRollback = async () => {
        setRestoreStatus('loading');
        setRestoreErrorMessage('');
        try {
            await axios.post(`${API_BASE}/rollback`, {}, getAuthHeader());
            setRestoreStatus('success');
            toast.success('تم التراجع عن التغييرات واستعادة الحالة السابقة بنجاح.');
        } catch (err: any) {
            setRestoreStatus('error');
            setRestoreErrorMessage(err.response?.data?.error || 'فشل التراجع عن التغييرات');
        }
    };

    const handleUpdateBackupFrequency = async (freq: string) => {
        setIsUpdatingConfig(true);
        try {
            const res = await axios.patch(`${API_BASE}/system-config`, { backupFrequency: freq }, getAuthHeader());
            setSystemConfig(res.data);
            toast.success('تم تحديث إعدادات النسخ الاحتياطي');
        } catch (err: any) {
            toast.error('خطأ في تحديث الإعدادات');
        } finally {
            setIsUpdatingConfig(false);
        }
    };

    const formatDate = (date: any) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('ar-EG', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme_page.accent)} />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري تحميل الإعدادات والتفضيلات...</p>
        </div>
    );

    if (authLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme_page.accent)} />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري التحقق من الصلاحيات...</p>
        </div>
    );

    if (!canManageSystem && !isAdmin && !checkPermission('SYSTEM_SETTINGS_VIEW')) {
        return <UnauthorizedAccess />;
    }

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto space-y-10 pb-16">
                <PageHeader
                    icon={APP_ICONS.MODULES.GENERAL_SETTINGS}
                    title="إعدادات النظام"
                    description="System Configuration & Metadata"
                >
                    <div className={cn("flex items-center gap-3 px-5 py-3 rounded-2xl border", theme_page.muted, theme_page.border)}>
                        <APP_ICONS.MODULES.ROLES className={theme_page.accent} size={20} />
                        <span className={cn("font-black text-sm", theme_page.accent.replace('text-', 'text-'))}>بيئة العمل مؤمنة بالكامل</span>
                    </div>
                </PageHeader>

                {canManageSystem && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <section className={cn("group bg-card rounded-[2.5rem] border shadow-xl overflow-hidden transition-all hover:shadow-2xl", theme_page.border, theme_page.shadow)}>
                            <div className="p-8 border-b border-border/50 flex justify-between items-center bg-gradient-to-l from-slate-50/50 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-3 rounded-2xl shadow-sm border group-hover:scale-110 transition-transform", theme_page.muted, theme_page.accent, theme_page.border)}>
                                        <APP_ICONS.MODULES.BRANCHES size={26} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-foreground/90">إدارة الفروع</h2>
                                        <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tighter">Organizational Units</p>
                                    </div>
                                </div>
                                <WithPermission permission="ENTITIES_CREATE">
                                    <CustomButton
                                        size="icon"
                                        onClick={() => { setEditingBranch(null); setIsBranchModalOpen(true); }}
                                        variant="primary"
                                        className="w-12 h-12"
                                    >
                                        <APP_ICONS.ACTIONS.ADD size={22} />
                                    </CustomButton>
                                </WithPermission>
                            </div>
                            <div className="p-4 space-y-3">
                                {branches.length === 0 ? (
                                    <div className="p-12 text-center opacity-20 flex flex-col items-center gap-3">
                                        <APP_ICONS.SHARED.BRIEFCASE size={48} />
                                        <p className="font-black">لا توجد فروع مسجلة</p>
                                    </div>
                                ) : branches.map(branch => (
                                    <div key={branch.id} className="p-5 rounded-3xl border border-border/50 hover:border-blue-100 hover:bg-blue-50/20 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-card rounded-2xl border border-border flex items-center justify-center text-muted-foreground/60 font-black shadow-sm group-hover:text-blue-500 group-hover:border-blue-200 transition-all">
                                                {branch.code?.substring(0, 2) || 'BR'}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-foreground/90 text-sm">{branch.name}</h3>
                                                <div className="flex flex-wrap items-center gap-3 text-xs font-bold mt-0.5">
                                                    <span className={cn("px-2 py-0.5 rounded-lg font-mono", theme_page.muted, theme_page.accent)}>CODE: {branch.code}</span>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <span className="text-muted-foreground/60 flex items-center gap-1">
                                                        <APP_ICONS.SHARED.GLOBE size={12} /> {branch.currency?.name} ({branch.currency?.code})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <WithPermission permission="ENTITIES_EDIT">
                                                <CustomButton
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => { setEditingBranch(branch); setIsBranchModalOpen(true); }}
                                                    className={cn("w-12 h-12 bg-card border hover:text-white hover:scale-110 transition-all", theme_page.border, theme_page.accent, theme_page.accent.replace('text-', 'hover:bg-'))}
                                                >
                                                    <APP_ICONS.ACTIONS.EDIT size={18} />
                                                </CustomButton>
                                            </WithPermission>
                                            <WithPermission permission="ENTITIES_DELETE">
                                                <CustomButton
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteBranch(branch.id)}
                                                    className="w-12 h-12 text-rose-500 bg-card border border-rose-50 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all"
                                                >
                                                    <APP_ICONS.ACTIONS.DELETE size={18} />
                                                </CustomButton>
                                            </WithPermission>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="group bg-card rounded-[2.5rem] border border-border shadow-xl shadow-slate-900/5 overflow-hidden transition-all hover:shadow-2xl">
                            <div className="p-8 border-b border-border/50 flex justify-between items-center bg-gradient-to-l from-emerald-50/50 to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 shadow-sm border border-emerald-200/50 group-hover:scale-110 transition-transform">
                                        <APP_ICONS.MODULES.CURRENCIES size={26} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-foreground/90">إدارة العملات</h2>
                                        <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tighter">Monetary Units</p>
                                    </div>
                                </div>
                                <WithPermission permission="CURRENCIES_CREATE">
                                    <CustomButton
                                        size="icon"
                                        onClick={() => { setEditingCurrency(null); setIsCurrencyModalOpen(true); }}
                                        variant="primary"
                                        className="w-12 h-12"
                                    >
                                        <APP_ICONS.ACTIONS.ADD size={22} />
                                    </CustomButton>
                                </WithPermission>
                            </div>
                            <div className="p-4 space-y-3">
                                {currencies.map(curr => (
                                    <div key={curr.id} className="p-5 rounded-3xl border border-border/50 hover:border-emerald-100 hover:bg-emerald-50/20 transition-all flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-card rounded-[1.25rem] border border-border flex items-center justify-center text-lg font-black text-muted-foreground/60 shadow-sm group-hover:text-emerald-500 group-hover:border-emerald-200 transition-all">
                                                {curr.symbol}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-black text-foreground/90 text-sm">{curr.name}</h3>
                                                    {curr.isBase && (
                                                        <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">Base</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-bold mt-0.5 text-muted-foreground/60">
                                                    <span className="font-mono text-emerald-600">ISO: {curr.code}</span>
                                                    <span className="text-muted-foreground/20">•</span>

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
                                                <CustomButton
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => { setHistoryCurrency(curr); setIsHistoryModalOpen(true); }}
                                                    className="w-10 h-10 text-blue-600 bg-card border border-blue-50 hover:bg-blue-600 hover:text-white hover:scale-110 transition-all"
                                                >
                                                    <APP_ICONS.MODULES.PERIODS size={14} />
                                                </CustomButton>
                                            )}
                                            <WithPermission permission="CURRENCIES_EDIT">
                                                <CustomButton
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => { setEditingCurrency(curr); setIsCurrencyModalOpen(true); }}
                                                    className="w-10 h-10 text-emerald-600 bg-card border border-emerald-50 hover:bg-emerald-600 hover:text-white hover:scale-110 transition-all"
                                                >
                                                    <APP_ICONS.ACTIONS.EDIT size={14} />
                                                </CustomButton>
                                            </WithPermission>
                                            {!curr.isBase && (
                                                <WithPermission permission="CURRENCIES_DELETE">
                                                    <CustomButton
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteCurrency(curr.id)}
                                                        className="w-10 h-10 text-rose-500 bg-card border border-rose-50 hover:bg-rose-500 hover:text-white hover:scale-110 transition-all"
                                                    >
                                                        <APP_ICONS.ACTIONS.DELETE size={14} />
                                                    </CustomButton>
                                                </WithPermission>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {isBranchModalOpen && (
                    <BranchModal branch={editingBranch} currencies={currencies} onClose={() => setIsBranchModalOpen(false)} onSave={fetchData} />
                )}

                {isCurrencyModalOpen && (
                    <CurrencyModal currency={editingCurrency} onClose={() => setIsCurrencyModalOpen(false)} onSave={fetchData} />
                )}

                {isHistoryModalOpen && (
                    <CurrencyHistoryModal currency={historyCurrency} onClose={() => setIsHistoryModalOpen(false)} />
                )}

                <ConfirmModal
                    open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={executeConfirm}
                    title={confirmConfig.title} description={confirmConfig.description}
                    confirmLabel={confirmConfig.label} variant={confirmConfig.variant}
                    icon={confirmConfig.icon} loading={confirmLoading}
                />

                {(checkPermission('DB_BACKUP') || checkPermission('DB_RESTORE')) && (
                    <section id="backup-section" className="bg-card rounded-[2.5rem] border border-blue-50 shadow-xl shadow-blue-500/5 overflow-hidden">
                        <div className="p-8 border-b border-blue-50 bg-gradient-to-l from-blue-50/50 to-transparent flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600 border border-blue-200/50">
                                    <APP_ICONS.MODULES.DATABASE size={26} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground/90">حفظ واستعادة البيانات</h2>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">آخر نسخة:</span>
                                            <span className="text-[11px] font-bold text-blue-600">{formatDate(systemConfig?.lastBackupAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase">النسخة القادمة:</span>
                                            <span className="text-[11px] font-bold text-emerald-600">{formatDate(systemConfig?.nextBackupAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30">
                            {checkPermission('DB_BACKUP') && (
                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between items-start gap-4 hover:border-blue-100 hover:shadow-md transition-all">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-50 rounded-xl">
                                                    <APP_ICONS.MODULES.DATABASE size={18} className="text-blue-500" />
                                                </div>
                                                <h3 className="font-black text-foreground/90">تصدير وبرمجة النسخ</h3>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-muted-foreground/20">
                                                <label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block mb-2">تكرار النسخ الاحتياطي التلقائي</label>
                                                <Select
                                                    value={systemConfig?.backupFrequency || 'NONE'}
                                                    onValueChange={handleUpdateBackupFrequency}
                                                    disabled={isUpdatingConfig}
                                                >
                                                    <SelectTrigger className="h-11 bg-card border-blue-50 shadow-sm rounded-xl font-bold">
                                                        <SelectValue placeholder="اختر التكرار" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-2xl border-blue-50 shadow-2xl">
                                                        <SelectItem value="NONE" className="font-bold py-3">بدون برمجة (يدوي فقط)</SelectItem>
                                                        <SelectItem value="DAILY" className="font-bold py-3 text-blue-600">يومياً (كل 24 ساعة)</SelectItem>
                                                        <SelectItem value="WEEKLY" className="font-bold py-3 text-indigo-600">أسبوعياً (كل 7 أيام)</SelectItem>
                                                        <SelectItem value="MONTHLY" className="font-bold py-3 text-violet-600">شهرياً (بداية كل شهر)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <p className="text-xs font-semibold leading-relaxed text-muted-foreground/70 px-1">
                                                سيتم تنزيل ملف <span className="text-blue-600 font-mono bg-blue-50 px-1 rounded">JSON</span> يحتوي على كافة العملات، الفروع، الحسابات، والقيود.
                                            </p>
                                        </div>
                                    </div>
                                    <CustomButton
                                        disabled={isBackingUp}
                                        onClick={handleBackup}
                                        variant="primary"
                                        className="w-full h-12"
                                    >
                                        {isBackingUp ? <><APP_ICONS.STATE.LOADING size={18} className="mr-2 animate-spin" /> جاري التصدير...</> : <><APP_ICONS.MODULES.DATABASE size={18} className="mr-2" /> تنزيل النسخة الاحتياطية</>}
                                    </CustomButton>
                                </div>
                            )}
                            {checkPermission('DB_RESTORE') && (
                                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between items-start gap-4 hover:border-indigo-100 hover:shadow-md transition-all">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <APP_ICONS.ACTIONS.IMPORT size={20} className="text-indigo-500" />
                                            <h3 className="font-black text-foreground/90">استعادة من نسخة احتياطية</h3>
                                        </div>
                                        <p className="text-xs font-semibold leading-relaxed text-muted-foreground/80">
                                            قم برفع ملف نسخة احتياطية سابق لاستعادة النظام. <strong className="text-rose-500">تنبيه: ستحذف كافة البيانات الحالية.</strong>
                                        </p>
                                    </div>
                                    <div className="w-full relative">
                                        <input type="file" accept=".json" onChange={handleRestoreFileSelect} disabled={restoreStatus === 'loading'} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                                        <CustomButton
                                            variant="outline"
                                            disabled={restoreStatus === 'loading'}
                                            className="w-full h-12 pointer-events-none"
                                        >
                                            {restoreStatus === 'loading' ? <><APP_ICONS.STATE.LOADING size={18} className="mr-2 animate-spin" /> جاري الاستعادة...</> : <><APP_ICONS.ACTIONS.IMPORT size={18} className="mr-2" /> رفع واستعادة النظام</>}
                                        </CustomButton>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {checkPermission('DB_RESET') && (
                    <section className="bg-card rounded-[2.5rem] border border-rose-100 shadow-xl shadow-rose-500/5 overflow-hidden mt-10">
                        <div className="p-8 border-b border-rose-100 bg-gradient-to-l from-rose-50/50 to-transparent flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 border border-rose-200/50">
                                    <APP_ICONS.ACTIONS.SHIELD_ALERT size={26} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground/90">منطقة الخطر</h2>
                                    <p className="text-sm font-semibold text-rose-600/80 mt-1">إجراءات حساسة تؤثر على النظام</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 bg-rose-50/80 rounded-3xl border border-rose-200">
                                <div>
                                    <h3 className="font-black text-rose-800 text-base">مسح جميع البيانات وإعادة الضبط</h3>
                                    <p className="text-sm text-rose-600/70 font-medium mt-1 max-w-lg">
                                        سيتم حذف كل شيء (حسابات، فروع، عملات، مستخدمين...) ما عدا حساب المدير.
                                    </p>
                                </div>
                                <CustomButton
                                    onClick={() => { setResetConfirmText(''); setIsResetModalOpen(true); }}
                                    variant="primary"
                                    className="px-8 h-12 shrink-0 bg-rose-600 hover:bg-rose-700 shadow-rose-200 hover:shadow-rose-300"
                                >
                                    <APP_ICONS.ACTIONS.UNDO size={16} />
                                    إعادة ضبط المصنع
                                </CustomButton>
                            </div>
                        </div>
                    </section>
                )}

                {isRestorePreviewOpen && (
                    <RestorePreviewModal
                        summary={restorePreviewData}
                        loading={restoreStatus === 'loading'}
                        onClose={() => setIsRestorePreviewOpen(false)}
                        onConfirm={handleConfirmRestore}
                    />
                )}

                {isRestoreResultOpen && (
                    <RestoreStatusModal
                        status={restoreStatus}
                        currentStep={restoreProgressStep}
                        error={restoreErrorMessage}
                        onClose={() => setIsRestoreResultOpen(false)}
                        onRollback={handleRollback}
                    />
                )}

                <ActionModal
                    isOpen={isResetModalOpen}
                    onClose={() => setIsResetModalOpen(false)}
                    title="تأكيد إعادة الضبط الكامل"
                    description="إجراء غير قابل للتراجع - مسح شامل لبيانات النظام"
                    icon={APP_ICONS.STATE.WARNING}
                    iconClassName="bg-rose-100 text-rose-600"
                    headerClassName="bg-rose-50 border-rose-100"
                    maxWidth="max-w-md"
                >
                    <div className="space-y-6">
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 text-sm text-rose-700 font-bold leading-relaxed">
                            ⚠️ سيتم مسح كافة البيانات (حسابات، فروع، عملات، عمليات...) وإعادة التطبيق لحالته الأولى.
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">
                                اكتب <span className="font-mono text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">RESET</span> للتأكيد
                            </label>
                            <Input
                                placeholder="RESET"
                                className="h-14 font-mono font-black border-rose-200 focus-visible:ring-rose-500 bg-rose-50/30 text-center text-xl tracking-widest rounded-2xl"
                                value={resetConfirmText}
                                onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <CustomButton
                                variant="outline"
                                onClick={() => setIsResetModalOpen(false)}
                                className="flex-1 h-14"
                            >
                                إلغاء
                            </CustomButton>
                            <CustomButton
                                disabled={resetConfirmText !== 'RESET' || isResetting}
                                onClick={handleResetAll}
                                variant="primary"
                                className="flex-[2] h-14 bg-rose-600 hover:bg-rose-700 shadow-rose-100"
                            >
                                {isResetting ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.REFRESH size={20} />}
                                {isResetting ? 'جاري المسح...' : 'تأكيد المسح الشامل'}
                            </CustomButton>
                        </div>
                    </div>
                </ActionModal>
            </div>
        </ProtectedRoute>
    );
};

// --- MODALS ---
function BranchModal({ branch, currencies, onClose, onSave }: any) {
    const [formData, setFormData] = useState(branch || { name: '', code: '', currencyId: currencies && currencies.length > 0 ? currencies[0].id : '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            if (branch) await axios.put(`${API_BASE}/branches/${branch.id}`, payload, getAuthHeader());
            else await axios.post(`${API_BASE}/branches`, payload, getAuthHeader());
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
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={branch ? 'تعديل الفرع' : 'إضافة فرع'}
            description="إدارة بيانات الفروع التنظيمية داخل النظام"
            icon={APP_ICONS.MODULES.BRANCHES}
            iconClassName="bg-blue-600 text-white shadow-blue-100"
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-black text-foreground/80">اسم الفرع</label>
                        <Input
                            required
                            placeholder="مثال: فرع الرياض الرئيس"
                            className="h-14 rounded-2xl bg-muted/50 border-input font-bold"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">الكود</label>
                            <Input
                                required
                                placeholder="E.G. BR-01"
                                className="h-14 rounded-2xl bg-muted/50 border-input font-bold uppercase"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">العملة الافتراضية</label>
                            <Select value={formData.currencyId} onValueChange={(v) => setFormData({ ...formData, currencyId: v })}>
                                <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-input font-bold" dir="rtl">
                                    <SelectValue placeholder="اختر العملة" />
                                </SelectTrigger>
                                <SelectContent dir="rtl" className="rounded-2xl border-border shadow-2xl">
                                    {currencies.map((curr: any) => (
                                        <SelectItem key={curr.id} value={curr.id} className="font-bold py-3 rounded-xl cursor-pointer">
                                            {curr.name} ({curr.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border/50 flex gap-4">
                    <CustomButton type="button" variant="outline" onClick={onClose} className="flex-1 h-14 border-none text-muted-foreground">إلغاء</CustomButton>
                    <CustomButton
                        disabled={loading}
                        type="submit"
                        variant="primary"
                        className="flex-[2] h-14"
                    >
                        {loading ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.SAVE size={20} />}
                        {branch ? 'تحديث الفرع' : 'إضافة فرع جديد'}
                    </CustomButton>
                </div>
            </form>
        </ActionModal>
    );
};

function CurrencyModal({ currency, onClose, onSave }: any) {
    const [formData, setFormData] = useState(currency || { name: '', code: '', symbol: '', isBase: false, exchangeRate: 1 });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData, exchangeRate: Number(formData.exchangeRate) };
            if (currency) await axios.put(`${API_BASE}/currencies/${currency.id}`, payload, getAuthHeader());
            else await axios.post(`${API_BASE}/currencies`, payload, getAuthHeader());
            onSave();
            onClose();
            toast.success('تم الحفظ');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل حفظ العملة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={currency ? 'تعديل العملة' : 'إضافة عملة'}
            description="إدارة الوحدات النقدية وأسعار الصرف المقابلة للعملة الأساسية"
            icon={APP_ICONS.MODULES.CURRENCIES}
            iconClassName="bg-emerald-600 text-white shadow-emerald-100"
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">اسم العملة</label>
                            <Input
                                required
                                placeholder="مثال: دولار أمريكي"
                                className="h-14 rounded-2xl bg-muted/50 border-input font-bold"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">رمز العملة (ISO)</label>
                            <Input
                                required
                                placeholder="E.G. USD"
                                className="h-14 rounded-2xl bg-muted/50 border-input font-bold uppercase"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-foreground/80">الرمز المختصر (Symbol)</label>
                            <Input
                                required
                                placeholder="مثال: $"
                                className="h-14 rounded-2xl bg-muted/50 border-input font-black text-center text-xl"
                                value={formData.symbol}
                                onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 flex flex-col">
                            <label className="text-sm font-black text-foreground/80 mb-2">نوع العملة</label>
                            <button
                                type="button"
                                className={cn(
                                    "flex items-center gap-3 h-14 px-5 rounded-2xl border transition-all font-bold",
                                    formData.isBase
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                        : "bg-muted/30 border-input text-muted-foreground/60 hover:bg-muted/50"
                                )}
                                onClick={() => setFormData({ ...formData, isBase: !formData.isBase })}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                                    formData.isBase ? "bg-emerald-600 border-emerald-600 text-white" : "border-muted-foreground/30 bg-card"
                                )}>
                                    {formData.isBase && <APP_ICONS.ACTIONS.CHECK size={16} />}
                                </div>
                                <span>عملة أساسية</span>
                            </button>
                        </div>
                    </div>

                    {!formData.isBase && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-sm font-black text-foreground/80">سعر الصرف (نسبة للعملة الأساسية)</label>
                            <div className="relative">
                                <Input
                                    required
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.0000"
                                    className="h-14 rounded-2xl bg-muted/50 border-input font-mono font-black text-lg pl-14"
                                    value={formData.exchangeRate}
                                    onChange={e => setFormData({ ...formData, exchangeRate: e.target.value })}
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-mono font-bold">
                                    RATE
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-border/50 flex gap-4">
                    <CustomButton type="button" variant="outline" onClick={onClose} className="flex-1 h-14 border-none text-muted-foreground">إلغاء</CustomButton>
                    <CustomButton
                        disabled={loading}
                        type="submit"
                        variant="primary"
                        className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    >
                        {loading ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.SAVE size={20} />}
                        {currency ? 'تحديث العملة' : 'حفظ العملة'}
                    </CustomButton>
                </div>
            </form>
        </ActionModal>
    );
};

const EditRateSubModal = ({ item, onClose, onSave }: any) => {
    const [rate, setRate] = useState(item.rate);
    const [date, setDate] = useState(new Date(item.date).toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`${API_BASE}/currencies/history/${item.id}`, { rate, date }, getAuthHeader());
            toast.success('تم التحديث');
            onSave();
        } catch {
            toast.error('فشل التحديث');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title="تعديل السعر"
            description={`تعديل السعر المسجل بتاريخ ${new Date(item.date).toLocaleDateString('ar-AR')}`}
        >
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">سعر الصرف</label>
                    <Input 
                        type="number" 
                        step="0.0001" 
                        value={rate} 
                        onChange={e => setRate(e.target.value)}
                        className="h-12 rounded-xl font-mono font-bold"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">التاريخ</label>
                    <Input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="h-12 rounded-xl font-mono font-bold"
                    />
                </div>
                <div className="flex gap-4 pt-2">
                    <CustomButton variant="outline" onClick={onClose} className="flex-1 h-12 border-none">إلغاء</CustomButton>
                    <CustomButton 
                        variant="primary" 
                        className="flex-[2] h-12"
                        onClick={handleSave}
                        isLoading={loading}
                    >
                        حفظ التعديلات
                    </CustomButton>
                </div>
            </div>
        </ActionModal>
    );
};

function CurrencyHistoryModal({ currency, onClose }: any) {
    const [history, setHistory] = useState<any[]>([]);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchHistory = () => {
        if (!currency) return;
        setLoading(true);
        axios.get(`${API_BASE}/currencies/${currency.id}/history`, getAuthHeader())
            .then(res => setHistory(res.data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHistory();
    }, [currency]);

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            await axios.delete(`${API_BASE}/currencies/history/${deletingId}`, getAuthHeader());
            toast.success('تم الحذف');
            fetchHistory();
        } catch (err) {
            toast.error('فشل الحذف');
        } finally {
            setIsDeleting(false);
            setDeletingId(null);
        }
    };

    if (!currency) return null;

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title={`سجل عملة: ${currency.name}`}
            description="ترصد حركة التغير في سعر الصرف مقابل العملة الأساسية عبر التاريخ"
            icon={APP_ICONS.MODULES.PERIODS}
            iconClassName="bg-blue-600 text-white"
            maxWidth="max-w-md"
        >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {loading && history.length === 0 ? (
                    <div className="flex justify-center p-10"><APP_ICONS.STATE.LOADING className="animate-spin text-blue-600" /></div>
                ) : history.length === 0 ? (
                    <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
                        <APP_ICONS.ACTIONS.SEARCH size={48} />
                        <p className="font-bold">لا يوجد سجل تقلبات لهذه العملة</p>
                    </div>
                ) : history.map(h => (
                    <div key={h.id} className="p-4 rounded-2xl border border-border/50 bg-muted/5 hover:bg-white hover:border-blue-100 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-muted-foreground/60 uppercase">التاريخ: </span>
                                <span className="font-bold text-sm text-foreground/80">{new Date(h.date).toLocaleDateString('ar-AR')}</span>
                        </div>
                            <span className="font-mono text-[14px] text-blue-600 font-bold mt-1">
                                {Number(h.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        <div className="flex gap-2">
                            <CustomButton 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => setEditingItem(h)}
                                className="w-8 h-8 text-blue-600 hover:bg-blue-50"
                            >
                                <APP_ICONS.ACTIONS.EDIT size={14} />
                            </CustomButton>
                            <CustomButton 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => setDeletingId(h.id)}
                                className="w-8 h-8 text-rose-600 hover:bg-rose-50"
                            >
                                <APP_ICONS.ACTIONS.DELETE size={14} />
                            </CustomButton>
                        </div>
                    </div>
                ))}
            </div>

            {editingItem && (
                <EditRateSubModal 
                    item={editingItem} 
                    onClose={() => setEditingItem(null)} 
                    onSave={() => { setEditingItem(null); fetchHistory(); }} 
                />
            )}

            <ConfirmModal
                open={!!deletingId}
                onOpenChange={(open) => !open && setDeletingId(null)}
                onConfirm={handleConfirmDelete}
                title="حذف سجل السعر"
                description="هل أنت متأكد من حذف هذا السجل التاريخي؟"
                loading={isDeleting}
            />

            <div className="pt-6 border-t border-border/50 flex justify-center">
                <CustomButton variant="outline" onClick={onClose} className="h-12 px-8 border-none text-muted-foreground">إغلاق</CustomButton>
            </div>
        </ActionModal>
    );
};

function RestorePreviewModal({ summary, loading, onClose, onConfirm }: any) {
    if (!summary) return null;

    const items = [
        { label: 'المستخدمين', count: summary.users, icon: APP_ICONS.MODULES.ROLES, color: 'text-blue-600 bg-blue-50' },
        { label: 'الفروع', count: summary.branches, icon: APP_ICONS.MODULES.BRANCHES, color: 'text-slate-600 bg-slate-50' },
        { label: 'الكيانات', count: summary.entities, icon: APP_ICONS.MODULES.ENTITIES, color: 'text-emerald-600 bg-emerald-50' },
        { label: 'الأعضاء', count: summary.members, icon: APP_ICONS.MODULES.ENTITIES, color: 'text-indigo-600 bg-indigo-50' },
        { label: 'الحسابات', count: summary.accounts, icon: APP_ICONS.MODULES.CURRENCIES, color: 'text-amber-600 bg-amber-50' },
        { label: 'القيود اليومية', count: summary.journalEntries, icon: APP_ICONS.MODULES.PERIODS, color: 'text-rose-600 bg-rose-50' },
        { label: 'اشتراكات الأعضاء', count: summary.memberSubscriptions, icon: APP_ICONS.MODULES.COLLECT, color: 'text-violet-600 bg-violet-50' },
        { label: 'سجلات العمليات (Audit)', count: summary.auditLogs, icon: APP_ICONS.ACTIONS.SEARCH, color: 'text-slate-600 bg-slate-50' },
    ];

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title="مراجعة بيانات نسخة الاحتياط"
            description="يرجى مراجعة ملخص البيانات قبل إتمام عملية الاستعادة"
            icon={APP_ICONS.ACTIONS.IMPORT}
            iconClassName="bg-blue-600 text-white shadow-blue-100"
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                    <APP_ICONS.STATE.WARNING className="text-rose-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-xs font-black text-rose-700 leading-relaxed">
                        تنبيه: ستقوم هذه العملية بحذف كافة البيانات الحالية في النظام واستبدالها بالكامل ببيانات نسخة الاحتياط المحددة. لا يمكن التراجع عن هذا الإجراء.
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col items-center text-center gap-2">
                            <div className={cn("p-2 rounded-xl", item.color)}>
                                <item.icon size={18} />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</div>
                                <div className="text-xl font-black font-mono">{item.count}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs text-muted-foreground font-bold">تاريخ النسخة الاحتياطية</div>
                    <div className="text-sm font-black text-slate-700 font-mono">
                        {summary.timestamp ? new Date(summary.timestamp).toLocaleString('ar-EG') : 'غير متوفر'}
                    </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-border/50">
                    <CustomButton variant="outline" onClick={onClose} disabled={loading} className="flex-1 h-14 border-none text-muted-foreground">
                        إلغاء العملية
                    </CustomButton>
                    <CustomButton
                        onClick={onConfirm}
                        disabled={loading}
                        variant="primary"
                        className="flex-[2] h-14"
                    >
                        {loading ? <APP_ICONS.STATE.LOADING size={20} className="animate-spin" /> : <APP_ICONS.ACTIONS.IMPORT size={20} />}
                        {loading ? 'جاري استيراد البيانات...' : 'تأكيد الاستعادة الآن'}
                    </CustomButton>
                </div>
            </div>
        </ActionModal>
    );
};

function RestoreStatusModal({ status, currentStep, error, onClose, onRollback }: any) {
    const steps = [
        { id: 1, label: 'تجهيز وتهيئة قاعدة البيانات', icon: APP_ICONS.ACTIONS.DELETE },
        { id: 2, label: 'استعادة الصلاحيات والأدوار', icon: APP_ICONS.MODULES.ROLES },
        { id: 3, label: 'استعادة الكيانات والمستخدمين', icon: APP_ICONS.MODULES.ENTITIES },
        { id: 4, label: 'استعادة الحسابات والبيانات المالية', icon: APP_ICONS.MODULES.CURRENCIES },
        { id: 5, label: 'إتمام العملية وتحديث النظام', icon: APP_ICONS.ACTIONS.CHECK },
    ];

    const isDone = status === 'success';
    const isError = status === 'error';
    const isLoading = status === 'loading';

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            preventClose={isLoading || isError}
            title={isError ? "فشل عملية الاستعادة" : isDone ? "تمت الاستعادة بنجاح" : "جاري استعادة البيانات"}
            description={isError ? "حدث خطأ منع إتمام العملية" : isDone ? "يتم الآن إعادة تشغيل النظام..." : "يرجى عدم إغلاق المتصفح حتى انتهاء العملية"}
            icon={isError ? APP_ICONS.STATE.WARNING : isDone ? APP_ICONS.ACTIONS.CHECK : APP_ICONS.STATE.LOADING}
            iconClassName={cn(
                "transition-all",
                isError ? "bg-rose-100 text-rose-600" : isDone ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600 animate-spin"
            )}
            maxWidth="max-w-md"
        >
            <div className="space-y-6">
                {!isError ? (
                    <div className="space-y-3">
                        {steps.map((step) => {
                            const isPast = currentStep > step.id || isDone;
                            const isCurrent = currentStep === step.id && !isDone;

                            return (
                                <div key={step.id} className={cn(
                                    "flex items-center gap-4 p-3 rounded-2xl border transition-all",
                                    isPast ? "bg-emerald-50/50 border-emerald-100 opacity-60" :
                                        isCurrent ? "bg-blue-50 border-blue-200 shadow-sm" :
                                            "bg-muted/10 border-transparent opacity-30"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                        isPast ? "bg-emerald-500 text-white" :
                                            isCurrent ? "bg-blue-600 text-white animate-pulse" :
                                                "bg-muted text-muted-foreground"
                                    )}>
                                        {isPast ? <APP_ICONS.ACTIONS.CHECK size={16} /> : <step.icon size={16} />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-black",
                                        isPast ? "text-emerald-700" : isCurrent ? "text-blue-700" : "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {(() => {
                            const parts = error?.split('@@@') || [error];
                            const mainError = parts[0];
                            const technicalDetail = parts[1];

                            return (
                                <div className="space-y-3">
                                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                                        <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">نوع الخطأ</div>
                                        <p className="text-sm font-bold text-rose-700 leading-relaxed italic">
                                            {mainError}
                                        </p>
                                    </div>

                                    {technicalDetail && (
                                        <div className="group border rounded-xl overflow-hidden transition-all border-rose-100 hover:border-rose-200">
                                            <details className="w-full">
                                                <summary className="flex items-center justify-between p-3 bg-rose-50/30 cursor-pointer list-none select-none">
                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                                        <APP_ICONS.ACTIONS.INFO size={12} />
                                                        عرض خيط المشكلة (التفاصيل الفنية)
                                                    </span>
                                                    <APP_ICONS.ACTIONS.DOWN size={14} className="text-rose-400 transition-transform group-open:rotate-180" />
                                                </summary>
                                                <div className="p-4 bg-muted/20 border-t border-rose-100">
                                                    <pre className="text-[10px] font-mono text-rose-600 leading-relaxed whitespace-pre-wrap break-all">
                                                        {technicalDetail}
                                                    </pre>
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        
                        <div className="text-xs text-muted-foreground font-medium leading-relaxed bg-muted/30 p-4 rounded-xl">
                            نصيحة: يمكنك محاولة التراجع عن التغييرات للعودة إلى حالة النظام المستقرة السابقة.
                        </div>
                        <div className="flex gap-3">
                            <CustomButton onClick={onClose} variant="ghost" className="flex-1 h-12 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 font-bold transition-colors">
                                إغلاق بدون تراجع
                            </CustomButton>
                            <CustomButton onClick={onRollback} variant="primary" className="flex-[2] h-12 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200">
                                <APP_ICONS.ACTIONS.UNDO size={16} className="mr-2" />
                                التراجع والعودة للحالة السابقة
                            </CustomButton>
                        </div>
                    </div>
                )}

                {isDone && (
                    <div className="space-y-4">
                        <div className="w-full bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                            <APP_ICONS.ACTIONS.CHECK className="text-emerald-600" size={20} />
                            <span className="text-sm font-black text-emerald-700">تمت استعادة كافة البيانات بنجاح.</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium text-center px-4">
                            يجب إعادة تشغيل النظام لتطبيق التغييرات وتحديث الجلسة الحالية.
                        </p>
                        <CustomButton
                            onClick={() => window.location.reload()}
                            variant="primary"
                            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200"
                        >
                            إعادة تشغيل النظام الآن
                        </CustomButton>
                    </div>
                )}
            </div>
        </ActionModal>
    );
}

export default SettingsPage;
