"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { APP_ICONS } from '@/lib/icons';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { UnauthorizedAccess } from '@/components/ui/UnauthorizedAccess';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/CustomButton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ActionModal } from '@/components/ui/ActionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const AuditLogPage = () => {
    const theme = usePageTheme();
    const { isAdmin, checkPermission } = useAuth();
    const canViewLogs = checkPermission('AUDIT_LOGS_VIEW');

    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingLog, setViewingLog] = useState<any>(null);
    const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState<{ open: boolean, id: string | null, isBulk: boolean, loading: boolean }>({ open: false, id: null, isBulk: false, loading: false });

    // New Filters
    const [filterAction, setFilterAction] = useState('all');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_BASE}/audit-logs`, AUTH_HEADER);
            setLogs(res.data);
            setSelectedLogs(new Set());
        } catch (err: any) {
            toast.error('فشل في تحميل السجلات');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmDelete({ open: true, id, isBulk: false, loading: false });
    };

    const handleBulkDelete = () => {
        if (selectedLogs.size === 0) return;
        setConfirmDelete({ open: true, id: null, isBulk: true, loading: false });
    };

    const confirmDeletionAction = async () => {
        setConfirmDelete(prev => ({ ...prev, loading: true }));
        try {
            if (confirmDelete.isBulk) {
                await axios.post(`${API_BASE}/audit-logs/bulk-delete`, { ids: Array.from(selectedLogs) }, AUTH_HEADER);
                toast.success('تم حذف السجلات بنجاح');
            } else if (confirmDelete.id) {
                await axios.delete(`${API_BASE}/audit-logs/${confirmDelete.id}`, AUTH_HEADER);
                toast.success('تم حذف السجل بنجاح');
            }
            fetchLogs();
            setConfirmDelete({ open: false, id: null, isBulk: false, loading: false });
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل عملية الحذف');
            setConfirmDelete(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        // Universal text search
        const matchesSearch = log.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase());

        // Action filter
        const matchesAction = filterAction === 'all' || log.action === filterAction;

        // Date filter (periodo)
        // en-GB string format is DD/MM/YYYY
        let matchesDate = true;
        if (log.date) {
            const [datePart] = log.date.split(',');
            const [day, month, year] = datePart.trim().split('/');
            const logDateISO = `${year}-${month?.padStart(2, '0')}-${day?.padStart(2, '0')}`;

            const isAfterStart = !filterStartDate || logDateISO >= filterStartDate;
            const isBeforeEnd = !filterEndDate || logDateISO <= filterEndDate;
            matchesDate = isAfterStart && isBeforeEnd;
        }

        return matchesSearch && matchesAction && matchesDate;
    });

    const handleExportExcel = () => {
        if (filteredLogs.length === 0) {
            toast.error('لا توجد بيانات للتصدير');
            return;
        }

        const exportData = filteredLogs.map(log => ({
            "المستخدم": log.user,
            "العملية": translateAction(log.action),
            "الهدف": translateEntity(log.entity),
            "معرف الهدف": log.entityId,
            "التاريخ والوقت": log.date,
            "التفاصيل": translateDetails(log)
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "AuditLogs");
        XLSX.writeFile(wb, `Audit_Logs_${new Date().getTime()}.xlsx`);
    };

    const uniqueActions = Array.from(new Set(logs.map(log => log.action))).filter(Boolean);

    const toggleSelectAll = () => {
        if (selectedLogs.size === filteredLogs.length && filteredLogs.length > 0) {
            setSelectedLogs(new Set());
        } else {
            setSelectedLogs(new Set(filteredLogs.map(l => l.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedLogs);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedLogs(newSet);
    };

    const translateAction = (action: string) => {
        const translations: { [key: string]: string } = {
            'CREATE': 'إنشاء',
            'UPDATE': 'تحديث',
            'DELETE': 'حذف',
            'POST': 'ترحيل',
            'UNPOST': 'إلغاء الترحيل',
            'LOGIN': 'تسجيل دخول',
            'IMPORT_MEMBERS': 'استيراد أعضاء',
            'COLLECT_SUBSCRIPTIONS': 'تحصيل اشتراكات',
            'UNPOST_COLLECTION': 'إلغاء ترحيل تحصيل',
            'POST_COLLECTION': 'ترحيل تحصيل',
            'VOUCHER_ATTACHMENT_DELETE': 'حذف مرفق',
            'CREATE_MEMBER': 'إضافة عضو جديد',
            'UPDATE_MEMBER': 'تعديل بيانات عضو',
            'DELETE_MEMBER': 'حذف عضو',
            'RESTORE': 'استعادة البيانات',
            'BACKUP': 'نسخ احتياطي'
        };
        return translations[action] ? `${action} (${translations[action]})` : action;
    };

    const translateEntity = (entity: string) => {
        const translations: { [key: string]: string } = {
            'Member': 'عضو',
            'Entity': 'جهة',
            'User': 'مستخدم',
            'JournalEntry': 'سند / قيد',
            'SubscriptionCollection': 'تحصيل اشتراكات',
            'Account': 'حساب',
            'Role': 'دور',
            'Permission': 'صلاحية',
            'Attachment': 'مرفق',
            'AuditLog': 'سجل عمليات'
        };
        return translations[entity] ? `${entity} (${translations[entity]})` : entity;
    };

    const translateDetails = (log: any) => {
        if (!log.details || log.details === '-') return '-';
        
        const details = typeof log.details === 'object' ? log.details : null;
        if (!details) return log.details;

        // Specialized formatting based on action
        switch (log.action) {
            case 'LOGIN':
                return `دخول المستخدم: ${details.username} من عنوان ${details.ip || 'مجهول'}`;
            case 'CREATE':
            case 'POST':
            case 'UNPOST':
                if (log.entity === 'JournalEntry') {
                    return `سند رقم: ${details.entryNumber || details.id || ''}`;
                }
                break;
            case 'CREATE_MEMBER':
                return `إضافة العضو: ${details.name}`;
            case 'UPDATE_MEMBER':
                return `تعديل العضو: ${details.name || details.id}`;
            case 'DELETE_MEMBER':
                return `حذف العضو المحقق: ${details.name || details.id}`;
            case 'IMPORT_MEMBERS':
                return `استيراد ملف: ${details.filename} (${details.importedCount} ناجح, ${details.errorsCount} فشل)`;
            case 'UNPOST_COLLECTION':
            case 'POST_COLLECTION':
                return `دفعة تحصيل برقم: ${details.id || log.entityId}`;
        }

        // Default: dynamic key parsing
        return Object.entries(details)
            .map(([key, val]) => `${key}: ${val}`)
            .join(' | ');
    };

    const getActionIcon = (action: string) => {
        if (action.includes('POST')) return <APP_ICONS.ACTIONS.SEND size={14} className="text-emerald-500" />;
        if (action.includes('CREATE')) return <APP_ICONS.ACTIONS.FILE_PLUS size={14} className="text-blue-500" />;
        if (action.includes('DELETE')) return <APP_ICONS.ACTIONS.DELETE size={14} className="text-rose-500" />;
        if (action.includes('UPDATE')) return <APP_ICONS.ACTIONS.EDIT size={14} className="text-amber-500" />;
        if (action.includes('LOGIN')) return <APP_ICONS.ACTIONS.PROFILE size={14} className="text-indigo-500" />;
        
        switch (action) {
            case 'LOCK': return <APP_ICONS.ACTIONS.LOCK size={14} className="text-rose-500" />;
            case 'IMPORT_MEMBERS': return <APP_ICONS.ACTIONS.IMPORT size={14} className="text-teal-500" />;
            default: return <APP_ICONS.MODULES.ROLES size={14} className="text-muted-foreground/60" />;
        }
    };

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            id: "select",
            header: () => (
                <label className="relative flex items-center justify-center cursor-pointer group">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={filteredLogs.length > 0 && selectedLogs.size === filteredLogs.length}
                        onChange={toggleSelectAll}
                    />
                    <div className={cn("w-4 h-4 border-2 border-slate-200 rounded-lg bg-white transition-all duration-300 peer-checked:border-current peer-checked:shadow-lg flex items-center justify-center", theme.accent.replace('text-', 'peer-checked:bg-'), theme.shadow.replace('shadow-', 'peer-checked:shadow-'))}>
                        <APP_ICONS.ACTIONS.CHECK size={10} className="text-white scale-0 peer-checked:scale-100 transition-transform duration-300" />
                    </div>
                </label>
            ),
            cell: ({ row }) => (
                <label className="relative flex items-center justify-center cursor-pointer group/item">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={selectedLogs.has(row.original.id)}
                        onChange={() => toggleSelect(row.original.id)}
                    />
                    <div className="w-4 h-4 border-2 border-slate-200 rounded-lg bg-white transition-all duration-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-checked:shadow-lg peer-checked:shadow-blue-200 group-hover/item:border-blue-400 flex items-center justify-center">
                        <APP_ICONS.ACTIONS.CHECK size={10} className="text-white scale-0 peer-checked:scale-100 transition-transform duration-300" />
                    </div>
                </label>
            ),
            enableSorting: false,
        },
        {
            accessorKey: "user",
            header: "المستخدم",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className={cn("w-7 h-7 rounded-xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-400 group-hover:bg-opacity-20 transition-all duration-500 shrink-0", theme.muted, theme.accent.replace('text-', 'group-hover:text-'), theme.border.replace('border-', 'group-hover:border-'))}>
                        <APP_ICONS.ACTIONS.PROFILE size={12} />
                    </div>
                    <span className="font-black text-slate-700 text-[11px] truncate">{row.original.user}</span>
                </div>
            )
        },
        {
            accessorKey: "action",
            header: "العملية",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="bg-slate-50 p-1 rounded-lg border border-slate-100 group-hover:scale-110 transition-transform duration-500 shrink-0">
                        {getActionIcon(row.original.action)}
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight truncate">{translateAction(row.original.action)}</span>
                </div>
            )
        },
        {
            accessorKey: "entity",
            header: "الهدف",
            cell: ({ row }) => (
                <span className={cn("px-2 py-1 bg-slate-100/50 rounded-xl border border-slate-100 text-[8px] font-black text-slate-500 uppercase group-hover:bg-white transition-all truncate block overflow-hidden", theme.accent.replace('text-', 'group-hover:text-'), theme.border.replace('border-', 'group-hover:border-'))}>
                    {translateEntity(row.original.entity)}: {row.original.entityId}
                </span>
            )
        },
        {
            accessorKey: "date",
            header: "التاريخ والوقت",
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono">
                    <APP_ICONS.ACTIONS.CALENDAR size={10} className="opacity-40" />
                    <span dir="ltr" className="truncate">{row.original.date}</span>
                </div>
            )
        },
        {
            accessorKey: "details",
            header: "التفاصيل",
            cell: ({ row }) => (
                <div className="text-slate-600 text-[11px] truncate font-bold opacity-80 group-hover:opacity-100 group-hover:text-slate-900 transition-all">
                    {translateDetails(row.original)}
                </div>
            )
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <CustomButton
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewingLog(row.original)}
                        className={cn("w-8 h-8 text-muted-foreground hover:bg-white hover:scale-110 transition-all", theme.accent.replace('text-', 'hover:text-'), theme.border.replace('border-', 'hover:border-'))}
                    >
                        <APP_ICONS.ACTIONS.VIEW size={14} />
                    </CustomButton>
                    <WithPermission permission="AUDIT_LOGS_DELETE">
                    <CustomButton
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(row.original.id)}
                        className="w-8 h-8 text-muted-foreground hover:text-rose-600 hover:bg-white hover:border-rose-100 hover:scale-110 transition-all"
                    >
                        <APP_ICONS.ACTIONS.DELETE size={14} />
                    </CustomButton>
                    </WithPermission>
                </div>
            )
        }
    ], [filteredLogs, selectedLogs]);

    return (
        <ProtectedRoute permission="AUDIT_LOGS_VIEW">
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <WithPermission permission="AUDIT_LOGS_DELETE">
            {selectedLogs.size > 0 && (
                <CustomButton
                    onClick={handleBulkDelete}
                    variant="danger"
                    className="z-[100] fixed top-20 left-4 h-10 px-4 mr-3"
                >
                    <APP_ICONS.ACTIONS.DELETE size={16} />
                    حذف المحدد ({selectedLogs.size})
                </CustomButton>
            )}
            </WithPermission>
            {/* Standard Premium Header */}
            <PageHeader
                icon={APP_ICONS.MODULES.AUDIT}
                title="سجل العمليات"
                description="Security Audit & Activity Logs"
            >
                <div className="relative">
                    <APP_ICONS.ACTIONS.SEARCH className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                    <Input
                        type="text"
                        placeholder="بحث في السجلات..."
                        className={cn("pr-10 pl-4 py-2 bg-card border-input rounded-xl w-56 text-xs font-bold h-10", theme.accent.replace('text-', 'focus-visible:ring-'))}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                </div>
            </PageHeader>

            {/* Advanced Filters Bar */}
            <div className="bg-card/80 backdrop-blur-xl p-4 rounded-3xl border border-border shadow-xl shadow-blue-500/5 flex flex-wrap gap-3 items-center" dir="rtl">
                <div className="w-full md:w-auto min-w-[150px]">
                    <Select value={filterAction} onValueChange={setFilterAction}>
                        <SelectTrigger className="h-11 bg-muted/50 border-border rounded-xl font-bold" dir="rtl">
                            <SelectValue placeholder="تصفية حسب العملية..." />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">كل العمليات</SelectItem>
                            {uniqueActions.map((action: any) => (
                                <SelectItem key={action} value={action}>{translateAction(action)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <APP_ICONS.ACTIONS.CALENDAR className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                            <Input
                                type="date"
                                className="h-11 pl-4 pr-10 bg-muted/50 border-border rounded-xl font-bold text-muted-foreground text-xs w-[140px]"
                                value={filterStartDate}
                                onChange={e => setFilterStartDate(e.target.value)}
                                title="من تاريخ (From)"
                            />
                        </div>
                        <span className="text-muted-foreground/40 font-bold">-</span>
                        <div className="relative">
                            <APP_ICONS.ACTIONS.CALENDAR className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                            <Input
                                type="date"
                                className="h-11 pl-4 pr-10 bg-muted/50 border-border rounded-xl font-bold text-muted-foreground text-xs w-[140px]"
                                value={filterEndDate}
                                onChange={e => setFilterEndDate(e.target.value)}
                                title="إلى تاريخ (To)"
                            />
                        </div>
                    </div>
                </div>

                {(filterAction !== 'all' || filterStartDate !== '' || filterEndDate !== '') && (
                    <CustomButton
                        variant="ghost"
                        onClick={() => { setFilterAction('all'); setFilterStartDate(''); setFilterEndDate(''); }}
                        className="h-11 text-muted-foreground/80 hover:text-rose-600 hover:bg-rose-50 px-4"
                    >
                        <APP_ICONS.ACTIONS.FILTER_X size={16} className="mr-2" />
                        مسح الفلاتر
                    </CustomButton>
                )}

                <div className="flex-1 md:flex-none md:mr-auto w-full md:w-auto mt-2 md:mt-0">
                    <WithPermission permission="AUDIT_LOGS_VIEW">
                    <CustomButton
                        variant="success"
                        onClick={handleExportExcel}
                        className="h-11 w-full"
                    >
                        <APP_ICONS.ACTIONS.EXPORT size={16} className="ml-2" />
                        تصدير Excel (الفترة المحددة)
                    </CustomButton>
                    </WithPermission>
                </div>
            </div>

            <div className={cn("bg-card rounded-[2.5rem] shadow-xl border overflow-hidden relative", theme.border, theme.shadow)}>
                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    loading={loading}
                    searchPlaceholder="بحث سريع في السجلات..."
                />
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <p className="text-amber-800 text-[11px] font-black opacity-80">
                    يمكن للمسؤولين المعتمدين فقط حذف السجلات بشكل نهائي. الحذف هو إجراء دائم.
                </p>
            </div>

            {viewingLog && (
                <ActionModal
                    isOpen={true}
                    onClose={() => setViewingLog(null)}
                    title="تفاصيل السجل"
                    description="البيانات الكاملة لسجل العمليات المحدد"
                    icon={APP_ICONS.MODULES.ROLES}
                    maxWidth="max-w-xl"
                >
                    <div className="space-y-6 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">المستخدم</div>
                                <div className="font-bold text-sm text-foreground/90">{viewingLog.user}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">الوقت والتاريخ</div>
                                <div className="font-bold text-sm text-foreground/90" dir="ltr">{viewingLog.date}</div>
                            </div>
                                <div className="space-y-1">
                                <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">العملية الهدف</div>
                                <div className="font-bold text-sm text-foreground/90">{translateAction(viewingLog.action)} - {translateEntity(viewingLog.entity)} ({viewingLog.entityId})</div>
                            </div>
                        </div>

                            <div className="space-y-2">
                            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">تفاصيل العملية</div>
                            <div className="bg-muted/50 p-4 rounded-2xl border border-border text-xs font-bold text-blue-800">
                                {translateDetails(viewingLog)}
                            </div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 mt-4">البيانات التقنية (JSON)</div>
                            <div className="bg-muted/5 p-4 rounded-2xl border border-border text-[10px] font-mono text-muted-foreground/60 overflow-x-auto">
                                <pre>{typeof viewingLog.details === 'object' ? JSON.stringify(viewingLog.details, null, 2) : viewingLog.details}</pre>
                            </div>
                        </div>
                    </div>
                </ActionModal>
            )}

            <ConfirmModal
                open={confirmDelete.open}
                onOpenChange={(open) => !confirmDelete.loading && setConfirmDelete(prev => ({ ...prev, open }))}
                title="تأكيد الحذف النهائي"
                description={confirmDelete.isBulk
                    ? `هل أنت متأكد أنك تريد حذف ${selectedLogs.size} سجل أمني نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`
                    : "هل أنت متأكد أنك تريد حذف هذا السجل الأمني نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
                }
                onConfirm={confirmDeletionAction}
                confirmLabel="نعم، احذف نهائياً"
                cancelLabel="إلغاء التحديد"
                variant="danger"
                loading={confirmDelete.loading}
            />
        </div>
        </ProtectedRoute>
    );
};

export default AuditLogPage;
