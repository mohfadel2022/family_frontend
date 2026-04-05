"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import axios from 'axios';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ActionModal } from '@/components/ui/ActionModal';
import { WithPermission } from '@/components/auth/WithPermission';

import { META_BASE, getAuthHeader } from '@/lib/api';
import { getCategoryIcon, getActionIcon } from '@/lib/permissions';
import { getAllNavPermissions, NavPermissionEntry } from '@/lib/nav';

const API_BASE = META_BASE;

interface Permission {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string;
}

export default function PermissionsPage() {
    const theme = usePageTheme();
    const { isAdmin, loading: authLoading, logout, checkPermission } = useAuth();

    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingPerm, setEditingPerm] = useState<Permission | null>(null);

    // ── Sync state ──────────────────────────────────────────────────────────────
    const [showSyncPanel, setShowSyncPanel] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [selectedMissing, setSelectedMissing] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: '',
        description: '',
        actions: [] as string[]
    });

    const AVAILABLE_ACTIONS = [
        { suffix: 'VIEW', label: 'عرض', icon: APP_ICONS.ACTIONS.VIEW },
        { suffix: 'CREATE', label: 'إضافة', icon: APP_ICONS.ACTIONS.ADD },
        { suffix: 'EDIT', label: 'تعديل', icon: APP_ICONS.ACTIONS.EDIT },
        { suffix: 'DELETE', label: 'حذف', icon: APP_ICONS.ACTIONS.DELETE },
        { suffix: 'PRINT', label: 'طباعة', icon: APP_ICONS.ACTIONS.PRINT },
        { suffix: 'IMPORT', label: 'استيراد', icon: APP_ICONS.ACTIONS.IMPORT },
        { suffix: 'EXPORT', label: 'تصدير', icon: APP_ICONS.ACTIONS.EXPORT },
    ];

    const [activeTab, setActiveTab] = useState<string | null>(null);

    const filteredPermissions = permissions.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
        const category = perm.category || 'عام';
        const parts = category.split('/').map(p => p.trim());
        const main = parts[0];
        const sub = parts[1] || '';

        if (!acc[main]) acc[main] = {};
        if (!acc[main][sub]) acc[main][sub] = [];
        acc[main][sub].push(perm);
        return acc;
    }, {} as Record<string, Record<string, Permission[]>>);

    const mainCategories = Object.keys(groupedPermissions);

    useEffect(() => {
        if (!activeTab && mainCategories.length > 0) {
            setActiveTab(mainCategories[0]);
        }
    }, [mainCategories, activeTab]);

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const expandMainAll = () => {
        if (!activeTab) return;
        const currentGroups = Object.keys(groupedPermissions[activeTab] || {});
        const newExpanded = { ...expandedGroups };
        currentGroups.forEach(g => newExpanded[g] = true);
        setExpandedGroups(newExpanded);
    };

    const collapseMainAll = () => {
        if (!activeTab) return;
        const currentGroups = Object.keys(groupedPermissions[activeTab] || {});
        const newExpanded = { ...expandedGroups };
        currentGroups.forEach(g => newExpanded[g] = false);
        setExpandedGroups(newExpanded);
    };

    const fetchPermissions = async () => {
        if (!isAdmin && !checkPermission('PERMISSIONS_VIEW')) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/permissions`, getAuthHeader());
            setPermissions(res.data);
        } catch (err: any) {
            console.error('Fetch error:', err);
            if (err.response?.status === 401) {
                logout();
            } else if (err.response?.status === 403) {
                toast.error('غير مصرح لك باستعراض هذه البيانات');
            } else {
                toast.error('حدث خطأ أثناء تحميل الصلاحيات');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, [isAdmin]);

    // ── Compute missing permissions ──────────────────────────────────────────────
    const allNavPerms = getAllNavPermissions();
    const dbCodes = new Set(permissions.map(p => p.code));
    const missingPerms: NavPermissionEntry[] = allNavPerms.filter(p => !dbCodes.has(p.code));

    // Group missing by category
    const missingByCategory = missingPerms.reduce((acc, p) => {
        const cat = p.category.split('/')[0].trim();
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, NavPermissionEntry[]>);

    const toggleSelectMissing = (code: string) => {
        setSelectedMissing(prev => {
            const next = new Set(prev);
            if (next.has(code)) next.delete(code);
            else next.add(code);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedMissing.size === missingPerms.length) {
            setSelectedMissing(new Set());
        } else {
            setSelectedMissing(new Set(missingPerms.map(p => p.code)));
        }
    };

    const handleSyncSelected = async () => {
        if (selectedMissing.size === 0) {
            toast.error('يرجى تحديد صلاحية واحدة على الأقل');
            return;
        }
        setSyncing(true);
        const toCreate = missingPerms.filter(p => selectedMissing.has(p.code));
        let created = 0;
        let failed = 0;
        try {
            await Promise.all(
                toCreate.map(async (p) => {
                    try {
                        await axios.post(`${API_BASE}/permissions`, {
                            code: p.code,
                            name: p.name,
                            category: p.category,
                            description: ''
                        }, getAuthHeader());
                        created++;
                    } catch {
                        failed++;
                    }
                })
            );
            if (created > 0) toast.success(`تم إضافة ${created} صلاحية بنجاح`);
            if (failed > 0) toast.error(`فشل إضافة ${failed} صلاحية`);
            setSelectedMissing(new Set());
            await fetchPermissions();
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المفتاح؟')) return;
        try {
            await axios.delete(`${API_BASE}/permissions/${id}`, getAuthHeader());
            toast.success('تم حذف المفتاح بنجاح');
            fetchPermissions();
        } catch (err: any) {
            console.error(err);
            toast.error('حدث خطأ أثناء حذف المفتاح');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <APP_ICONS.STATE.LOADING className={cn("animate-spin", theme.accent)} size={48} />
                <p className="text-muted-foreground/80 font-bold">جاري تحميل مصفوفة الصلاحيات...</p>
            </div>
        );
    }

    const handleOpenModal = (perm: Permission | null = null) => {
        if (perm) {
            setEditingPerm(perm);
            setFormData({
                code: perm.code,
                name: perm.name,
                category: perm.category,
                description: perm.description || '',
                actions: []
            });
        } else {
            setEditingPerm(null);
            setFormData({
                code: '',
                name: '',
                category: 'GENERAL',
                description: '',
                actions: ['VIEW', 'CREATE', 'EDIT', 'DELETE']
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingPerm) {
                await axios.put(`${API_BASE}/permissions/${editingPerm.id}`, {
                    code: formData.code,
                    name: formData.name,
                    category: formData.category,
                    description: formData.description
                }, getAuthHeader());
                toast.success('تم تحديث الصلاحية بنجاح');
            } else {
                if (formData.actions.length > 0) {
                    await Promise.all(formData.actions.map(action => {
                        const actObj = AVAILABLE_ACTIONS.find(a => a.suffix === action);
                        return axios.post(`${API_BASE}/permissions`, {
                            code: `${formData.code}_${action}`,
                            name: `${actObj?.label || action} ${formData.name}`,
                            category: formData.category,
                            description: formData.description
                        }, getAuthHeader());
                    }));
                    toast.success('تم إضافة مجموعة الصلاحيات بنجاح');
                } else {
                    await axios.post(`${API_BASE}/permissions`, {
                        code: formData.code,
                        name: formData.name,
                        category: formData.category,
                        description: formData.description
                    }, getAuthHeader());
                    toast.success('تم إضافة الصلاحية بنجاح');
                }
            }
            setIsModalOpen(false);
            fetchPermissions();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'حدث خطأ ما');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ProtectedRoute permission="PERMISSIONS_VIEW">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12" dir="rtl">
                <PageHeader
                    icon={APP_ICONS.MODULES.PERMISSIONS}
                    title="إدارة الصلاحيات"
                    description="عرض وتعديل كافة الأذونات المتاحة في النظام وتصنيفها حسب الموديولات"
                    iconClassName="bg-gradient-to-br from-indigo-700 to-indigo-900 shadow-indigo-100"
                >
                    <div className="flex gap-3 flex-wrap">
                        {/* Sync button */}
                        <WithPermission permission="PERMISSIONS_CREATE">
                            <Button
                                onClick={() => setShowSyncPanel(prev => !prev)}
                                variant="outline"
                                className={cn(
                                    "h-12 px-5 rounded-2xl font-bold flex gap-2 items-center border-2 transition-all",
                                    showSyncPanel
                                        ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                                        : "border-border text-muted-foreground hover:border-amber-300 hover:text-amber-600"
                                )}
                            >
                                <APP_ICONS.ACTIONS.SYNC size={18} />
                                مزامنة صلاحيات الصفحات
                                {missingPerms.length > 0 && (
                                    <span className="bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full ml-1">
                                        {missingPerms.length}
                                    </span>
                                )}
                            </Button>
                        </WithPermission>

                        <div className="relative group">
                            <APP_ICONS.ACTIONS.SEARCH className={cn("absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors", theme.accent.replace('text-', 'group-hover:text-'))} size={18} />
                            <Input
                                className={cn("h-12 w-64 pr-11 pl-4 rounded-2xl bg-card border-border shadow-sm font-bold", theme.accent.replace('text-', 'focus:ring-').replace('600', '500/20'))}
                                placeholder="بحث في الصلاحيات..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <WithPermission permission="PERMISSIONS_CREATE">
                            <Button
                                onClick={() => handleOpenModal()}
                                className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl h-12 px-6 shadow-xl flex gap-2 items-center font-bold"
                            >
                                <APP_ICONS.ACTIONS.ADD size={20} />
                                إضافة صلاحية
                            </Button>
                        </WithPermission>
                    </div>
                </PageHeader>

                {/* ── Sync Panel ─────────────────────────────────────────────────────────── */}
                {showSyncPanel && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="rounded-[2rem] border-2 border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-700/40 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-amber-200/60 dark:border-amber-700/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                                        <APP_ICONS.ACTIONS.SYNC size={20} />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-foreground/90 text-base">مزامنة صلاحيات الصفحات مع قاعدة البيانات</h2>
                                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                                            المقارنة بين صلاحيات التطبيق الحالية وما هو مسجل في قاعدة البيانات
                                        </p>
                                    </div>
                                </div>
                                {/* Stats summary */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="font-black text-emerald-700 dark:text-emerald-400">{dbCodes.size} موجودة</span>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-xl",
                                        missingPerms.length > 0
                                            ? "bg-amber-100 dark:bg-amber-900/30"
                                            : "bg-muted/50"
                                    )}>
                                        <div className={cn("w-2 h-2 rounded-full", missingPerms.length > 0 ? "bg-amber-500" : "bg-muted-foreground/30")} />
                                        <span className={cn("font-black", missingPerms.length > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground/60")}>
                                            {missingPerms.length} ناقصة
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-xl">
                                        <span className="font-black text-muted-foreground/70">{allNavPerms.length} إجمالي</span>
                                    </div>
                                </div>
                            </div>

                            {missingPerms.length === 0 ? (
                                /* All synced  ✅ */
                                <div className="flex flex-col items-center justify-center py-16 gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                                        <APP_ICONS.STATE.SUCCESS size={36} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-lg text-foreground/80">جميع الصلاحيات متزامنة!</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1">لا توجد صلاحيات مفقودة في قاعدة البيانات.</p>
                                    </div>
                                </div>
                            ) : (
                                /* Missing list */
                                <div className="p-6 space-y-6">
                                    {/* Bulk actions bar */}
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={toggleSelectAll}
                                            className="flex items-center gap-2 text-sm font-black text-muted-foreground/70 hover:text-foreground transition-colors"
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                                selectedMissing.size === missingPerms.length
                                                    ? "bg-amber-500 border-amber-500 text-white"
                                                    : "border-muted-foreground/30"
                                            )}>
                                                {selectedMissing.size === missingPerms.length && (
                                                    <APP_ICONS.STATE.SUCCESS size={10} />
                                                )}
                                            </div>
                                            {selectedMissing.size === missingPerms.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                        </button>

                                        <WithPermission permission="PERMISSIONS_CREATE">
                                            <Button
                                                onClick={handleSyncSelected}
                                                disabled={syncing || selectedMissing.size === 0}
                                                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-10 px-5 font-black flex gap-2 items-center shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 disabled:opacity-50"
                                            >
                                                {syncing
                                                    ? <APP_ICONS.STATE.LOADING className="animate-spin" size={16} />
                                                    : <APP_ICONS.ACTIONS.ADD size={16} />
                                                }
                                                إضافة المحددة ({selectedMissing.size})
                                            </Button>
                                        </WithPermission>
                                    </div>

                                    {/* Missing permissions grouped by category */}
                                    <div className="space-y-4">
                                        {Object.entries(missingByCategory).map(([cat, perms]) => {
                                            const CatIcon = getCategoryIcon(cat);
                                            return (
                                                <div key={cat} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
                                                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/30">
                                                        <CatIcon size={14} className="text-amber-500 shrink-0" />
                                                        <span className="text-xs font-black text-foreground/70">{cat}</span>
                                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-black">{perms.length}</span>
                                                    </div>
                                                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                        {perms.map(perm => {
                                                            const ActionIcon = getActionIcon(perm.code);
                                                            const isChecked = selectedMissing.has(perm.code);
                                                            return (
                                                                <button
                                                                    key={perm.code}
                                                                    onClick={() => toggleSelectMissing(perm.code)}
                                                                    className={cn(
                                                                        "flex items-center gap-2 p-2 rounded-xl border-2 transition-all text-right group",
                                                                        isChecked
                                                                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                                                                            : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-muted"
                                                                    )}
                                                                >
                                                                    <div className={cn(
                                                                        "w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                                                                        isChecked
                                                                            ? "bg-amber-500 border-amber-500 text-white"
                                                                            : "border-muted-foreground/30 group-hover:border-amber-300"
                                                                    )}>
                                                                        {isChecked && <APP_ICONS.STATE.SUCCESS size={8} />}
                                                                    </div>
                                                                    <div className={cn(
                                                                        "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                                                                        isChecked ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40" : "bg-muted text-muted-foreground/50"
                                                                    )}>
                                                                        <ActionIcon size={12} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 text-right">
                                                                        <p className="text-[11px] font-black text-foreground/80 truncate">{perm.name}</p>
                                                                        <code className="text-[8px] text-muted-foreground/40 truncate block font-mono">
                                                                            {perm.code.split('_').pop()}
                                                                        </code>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Bottom bulk add */}
                                    <div className="flex justify-end pt-2">
                                        <WithPermission permission="PERMISSIONS_CREATE">
                                            <Button
                                                onClick={() => {
                                                    setSelectedMissing(new Set(missingPerms.map(p => p.code)));
                                                    setTimeout(handleSyncSelected, 100);
                                                }}
                                                disabled={syncing}
                                                variant="outline"
                                                className="rounded-xl h-10 px-5 font-black flex gap-2 items-center border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20"
                                            >
                                                {syncing
                                                    ? <APP_ICONS.STATE.LOADING className="animate-spin" size={16} />
                                                    : <APP_ICONS.ACTIONS.PLUS_SQUARE size={16} />
                                                }
                                                إضافة جميع الناقصة ({missingPerms.length})
                                            </Button>
                                        </WithPermission>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── DB Permissions — All synced status bar ─────────────────────────────── */}
                {!showSyncPanel && missingPerms.length > 0 && (
                    <div
                        onClick={() => setShowSyncPanel(true)}
                        className="flex items-center gap-3 p-3 px-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 rounded-2xl cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all group"
                    >
                        <APP_ICONS.STATE.WARNING size={16} className="text-amber-500 shrink-0" />
                        <p className="text-sm font-bold text-amber-700 dark:text-amber-400 flex-1">
                            يوجد <span className="font-black">{missingPerms.length}</span> صلاحية غير مسجلة في قاعدة البيانات
                        </p>
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 group-hover:underline">
                            عرض التفاصيل ←
                        </span>
                    </div>
                )}

                {/* Tabs Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar px-2">
                    {mainCategories.map(cat => {
                        const Icon = getCategoryIcon(cat);
                        const isActive = activeTab === cat;
                        const count = Object.values(groupedPermissions[cat]).flat().length;

                        return (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-sm whitespace-nowrap transition-all border-2",
                                    isActive
                                        ? cn("text-white border-transparent shadow-lg scale-105", theme.primary, theme.shadow)
                                        : cn("bg-card text-muted-foreground/80 border-border/50 transition-all", theme.accent.replace('text-', 'hover:border-').replace('600', '100'), theme.accent.replace('text-', 'hover:text-'))
                                )}
                            >
                                <Icon size={18} />
                                {cat}
                                <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px]",
                                    isActive ? "bg-card/20 text-white" : "bg-muted/50 text-muted-foreground/60"
                                )}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Toggle Expand/Collapse All */}
                {activeTab && Object.keys(groupedPermissions[activeTab] || {}).length > 1 && (
                    <div className="flex justify-end gap-3 px-4">
                        <button
                            onClick={expandMainAll}
                            className={cn("flex items-center gap-2 text-[10px] font-black transition-colors px-3 py-1.5 rounded-full", theme.muted.replace('bg-', 'bg-').replace('50', '50/50'), theme.accent)}
                        >
                            <APP_ICONS.ACTIONS.PLUS_SQUARE size={14} />
                            توسيع الكل
                        </button>
                        <button
                            onClick={collapseMainAll}
                            className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 hover:text-muted-foreground transition-colors bg-muted/30 px-3 py-1.5 rounded-full"
                        >
                            <APP_ICONS.ACTIONS.MINUS_SQUARE size={14} />
                            طي الكل
                        </button>
                    </div>
                )}

                {/* Permissions by View / Action Group */}
                <div className="space-y-14 pt-4">
                    {activeTab && groupedPermissions[activeTab] && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
                            {/* Action Groups */}
                            <div className="grid grid-cols-1 gap-4">
                                {Object.entries(groupedPermissions[activeTab]).map(([subGroup, perms]) => {
                                    const isExpanded = expandedGroups[subGroup] !== false; // Default expanded
                                    const SubGroupIcon = getCategoryIcon(subGroup ? `${activeTab} / ${subGroup}` : activeTab);
                                    return (
                                        <div key={subGroup} className="bg-muted/50/30 rounded-[2rem] border border-border overflow-hidden">
                                            <button
                                                onClick={() => toggleGroup(subGroup)}
                                                className="w-full flex justify-between items-center p-4 hover:bg-card/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1.5 h-6 rounded-full", theme.primary)} />
                                                    <SubGroupIcon size={16} className={cn("shrink-0", theme.accent)} />
                                                    <h3 className="text-base font-black text-foreground/80">{subGroup || 'صلاحيات عامة'}</h3>
                                                    <span className="text-[10px] bg-card px-2 py-0.5 rounded-full border border-border text-muted-foreground/60 font-bold">
                                                        {perms.length}
                                                    </span>
                                                </div>
                                                {isExpanded ? <APP_ICONS.ACTIONS.CHEVRON_DOWN size={20} className="text-muted-foreground/60" /> : <APP_ICONS.ACTIONS.CHEVRON_DOWN size={20} className="text-muted-foreground/60 -rotate-90" />}
                                            </button>

                                            {isExpanded && (
                                                <div className="p-2 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 animate-in slide-in-from-top-2 duration-300">
                                                    {perms.map(perm => {
                                                        const ActionIcon = getActionIcon(perm.code);
                                                        return (
                                                            <div key={perm.id} className={cn("bg-card p-2 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex items-center gap-2", theme.accent.replace('text-', 'hover:border-').replace('600', '100'))}>
                                                                <div className={cn("absolute top-0 right-0 w-0.5 h-full opacity-0 group-hover:opacity-100 transition-opacity", theme.primary)} />

                                                                <div className={cn("w-7 h-7 rounded-lg bg-muted/50 text-muted-foreground/60 flex items-center justify-center shrink-0 transition-colors", theme.muted.replace('bg-', 'group-hover:bg-'), theme.accent.replace('text-', 'group-hover:text-'))}>
                                                                    <ActionIcon size={14} />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-[10px] font-black text-foreground/80 leading-tight truncate" title={perm.name}>{perm.name}</h4>
                                                                    <code className="text-[7px] font-bold text-muted-foreground/40 truncate block">{perm.code.split('_').pop()}</code>
                                                                </div>

                                                                <div className="flex opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                                    <WithPermission permission="PERMISSIONS_EDIT">
                                                                        <Button size="icon" variant="ghost" className={cn("w-5 h-5 rounded-md text-muted-foreground hover:scale-110 transition-all", theme.accent.replace('text-', 'hover:text-'))} onClick={(e) => { e.stopPropagation(); handleOpenModal(perm); }}>
                                                                            <APP_ICONS.ACTIONS.EDIT size={10} />
                                                                        </Button>
                                                                    </WithPermission>
                                                                    <WithPermission permission="PERMISSIONS_DELETE">
                                                                        <Button size="icon" variant="ghost" className="w-5 h-5 rounded-md text-muted-foreground hover:text-rose-500 hover:scale-110 transition-all ml-0.5" onClick={(e) => { e.stopPropagation(); handleDelete(perm.id); }}>
                                                                            <APP_ICONS.ACTIONS.DELETE size={10} />
                                                                        </Button>
                                                                    </WithPermission>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {mainCategories.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/60 gap-4">
                            <APP_ICONS.ACTIONS.SEARCH size={48} className="opacity-20" />
                            <p className="font-bold">لم يتم العثور على أي صلاحيات تطابق بحثك</p>
                        </div>
                    )}
                </div>

                {/* Modal */}
                <ActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingPerm ? 'تعديل الصلاحية' : 'إضافة صلاحية جديدة'}
                    description="عرض وتعديل كافة الأذونات المتاحة في النظام"
                    icon={APP_ICONS.MODULES.ROLES}
                    iconClassName="bg-indigo-900 text-white shadow-indigo-100/20"
                    headerClassName="bg-indigo-950 text-white border-indigo-900"
                    maxWidth="max-w-lg"
                    preventClose={true}
                    showCloseButton={false}
                >
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-foreground/80">
                                        {editingPerm ? 'الكود البرمجي' : 'الكود الأساسي (Base Code)'}
                                    </label>
                                    <Input
                                        className="h-12 rounded-xl bg-muted/50 border-input font-bold uppercase"
                                        placeholder={editingPerm ? "E.G. USERS_VIEW" : "E.G. USERS"}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                    />
                                    {!editingPerm && formData.actions.length > 0 && formData.code && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            سيتم توليد: <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded">{formData.code}_{formData.actions[0]}</span> ...
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-black text-foreground/80">التصنيف (الموديول)</label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, category: '' }))}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800"
                                        >
                                            + تصنيف جديد
                                        </button>
                                    </div>
                                    {permissions.some(p => p.category === formData.category) || formData.category === 'GENERAL' || !formData.category ? (
                                        <select
                                            className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-input font-bold text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        >
                                            <option value="" disabled>اختر التصنيف...</option>
                                            {Array.from(new Set(permissions.map(p => p.category)))
                                                .sort()
                                                .map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))
                                            }
                                            <option value="GENERAL">عام</option>
                                        </select>
                                    ) : (
                                        <div className="relative">
                                            <Input
                                                className="h-12 rounded-xl bg-muted/50 border-input font-bold pl-10"
                                                placeholder="مثال: الإعدادات / موديول جديد"
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, category: 'GENERAL' }))}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-indigo-600"
                                            >
                                                <APP_ICONS.ACTIONS.UNDO size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">
                                    {editingPerm ? 'اسم الصلاحية (بالعربي)' : 'الاسم الأساسي (مثال: المستخدمين)'}
                                </label>
                                <Input
                                    className="h-12 rounded-xl bg-muted/50 border-input font-bold"
                                    placeholder={editingPerm ? "مثال: مشاهدة قائمة المستخدمين" : "مثال: المستخدمين"}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {!editingPerm && (
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-foreground/80">الإجراءات المطلوبة</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-muted/30 p-4 rounded-xl border border-border">
                                        {AVAILABLE_ACTIONS.map(action => {
                                            const ActionIcon = action.icon;
                                            const isSelected = formData.actions.includes(action.suffix);
                                            return (
                                                <label
                                                    key={action.suffix}
                                                    className={cn(
                                                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border select-none",
                                                        isSelected ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "bg-card border-transparent text-muted-foreground hover:bg-muted/50"
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newActions = e.target.checked
                                                                ? [...formData.actions, action.suffix]
                                                                : formData.actions.filter(a => a !== action.suffix);
                                                            setFormData({ ...formData, actions: newActions });
                                                        }}
                                                    />
                                                    <div className={cn("w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-indigo-100 text-indigo-700" : "bg-muted text-muted-foreground/60")}>
                                                        <ActionIcon size={14} />
                                                    </div>
                                                    <span className="text-xs font-bold leading-tight flex-1">{action.label}</span>
                                                </label>
                                            );
                                        })}
                                        {formData.actions.length === 0 && (
                                            <div className="col-span-full text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                                <APP_ICONS.STATE.WARNING size={12} className="inline-block ml-1" />
                                                ستيم إنشاء صلاحية واحدة بالاسم والكود الذي أدخلته (بدون لواحق).
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-black text-foreground/80">الوصف</label>
                                <textarea
                                    className="w-full p-4 rounded-xl bg-muted/50 border border-input font-bold text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-24"
                                    placeholder="اشرح ماذا تمكن هذه الصلاحية المستخدم من فعله..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-border/50 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 h-12 rounded-xl font-bold px-8"
                            >
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-12 shadow-lg shadow-indigo-100 transition-all flex gap-2 items-center justify-center"
                            >
                                {submitting ? <APP_ICONS.STATE.LOADING className="animate-spin" size={20} /> : <APP_ICONS.MODULES.ROLES size={20} />}
                                {editingPerm ? 'تحديث الصلاحية' : 'حفظ الصلاحية'}
                            </Button>
                        </div>
                    </form>
                </ActionModal>
            </div>
        </ProtectedRoute>
    );
}
