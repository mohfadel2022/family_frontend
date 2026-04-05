"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBox } from '@/components/ui/IconBox';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { SearchableAccountSelect } from '@/components/SearchableAccountSelect';
import { ActionModal } from '@/components/ui/ActionModal';
import { AccountForm } from '@/components/forms/AccountForm';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AttachmentUpload } from '@/components/AttachmentUpload';
import { ViewAttachmentsModal } from '@/components/ViewAttachmentsModal';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import { API_BASE, META_BASE, COST_CENTER_BASE, getAuthHeader } from '@/lib/api';
import { usePageTheme } from '@/hooks/usePageTheme';
import { LineCostCenterModal } from '@/components/vouchers/LineCostCenterModal';

// Remove local API_BASE and getAuthHeader, now using imports from @/lib/api

interface JournalLine {
    id?: string;
    tempId: string;
    accountId: string;
    currencyId: string;
    currencyCode: string;
    debit: number;
    credit: number;
    exchangeRate: number;
    baseDebit: number;
    baseCredit: number;
    costCenters: { costCenterId: string, percentage: number }[];
}

const PaymentsPage = () => {
    const theme = usePageTheme();
    const { checkPermission, isAdmin } = useAuth();
    const canView = checkPermission('PAYMENT_VIEW');
    const canCreate = checkPermission('PAYMENT_CREATE');
    const canEdit = checkPermission('PAYMENT_EDIT');
    const canDelete = checkPermission('PAYMENT_DELETE');
    const canPrint = checkPermission('PAYMENT_PRINT');
    const canPost = checkPermission('PAYMENT_POST');
    const canUnpost = checkPermission('PAYMENT_UNPOST');

    const [view, setView] = useState<'list' | 'form'>('list');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    // Form State
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [branchId, setBranchId] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([]);
    const [attachments, setAttachments] = useState<any[]>([]);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [costCenters, setCostCenters] = useState<any[]>([]);
    const [isActionModalOpen, seIsActionModalOpen] = useState(false);

    // Attachment Viewer State
    const [viewAttachmentsEntry, setViewAttachmentsEntry] = useState<any>(null);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; variant: 'danger' | 'warning'; icon: any; label: string }>(
        { title: '', description: '', variant: 'danger', icon: APP_ICONS.STATE.WARNING, label: '' }
    );
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [activeLineForCc, setActiveLineForCc] = useState<string | null>(null);

    const askConfirm = (config: typeof confirmConfig, action: () => Promise<void>) => {
        setConfirmConfig(config);
        setConfirmAction(() => action);
        setConfirmOpen(true);
    };

    const executeConfirm = async () => {
        if (!confirmAction) return;
        setConfirmLoading(true);
        try { await confirmAction(); } finally {
            setConfirmLoading(false);
            setConfirmOpen(false);
        }
    };

    // Only leaf accounts (those without children) can be used in voucher lines
    // Restricted to LIABILITY, EXPENSE, and ASSET (for Cash) in Base Currency as per user request
    const leafAccounts = accounts.filter(a =>
        !accounts.some(b => b.parentId === a.id) &&
        (a.type === 'LIABILITY' || a.type === 'EXPENSE' || a.type === 'ASSET') &&
        a.currency.isBase
    );

    const searchParams = useSearchParams();
    const entryId = searchParams.get('id');

    useEffect(() => {
        if (!canView) return;
        fetchMeta();
        fetchEntries();
        if (entryId) {
            fetchEntryById(entryId);
        }
    }, [entryId, canView]);

    const fetchEntryById = async (id: string) => {
        try {
            const res = await axios.get(`${API_BASE}/journals/${id}`, getAuthHeader());
            handleEdit(res.data, res.data.status === 'POSTED');
        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل بيانات السند المخصص');
        }
    };

    const fetchMeta = async () => {
        try {
            const [accRes, branchRes, currRes, ccRes] = await Promise.all([
                axios.get(`${META_BASE}/accounts`, getAuthHeader()),
                axios.get(`${META_BASE}/branches`, getAuthHeader()),
                axios.get(`${META_BASE}/currencies`, getAuthHeader()),
                axios.get(`${COST_CENTER_BASE}`, getAuthHeader())
            ]);
            setAccounts(accRes.data);
            setBranches(branchRes.data);
            setCurrencies(currRes.data);
            // Filter to only show secondary centers (those with parents)
            setCostCenters(ccRes.data.filter((cc: any) => cc.parentId !== null));
            if (branchRes.data.length > 0) setBranchId(branchRes.data[0].id);
        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل القوائم الأساسية');
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/journals?type=PAYMENT`, getAuthHeader());
            setEntries(res.data);
        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل سجل السندات');
        }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setEditingId(null);
        setDescription('سند صرف رقم ...');
        setDate(new Date().toISOString().split('T')[0]);
        setLines([
            { tempId: '1', accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0, costCenters: [] },
            { tempId: '2', accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0, costCenters: [] },
        ]);
        setAttachments([]);
        setStatus(null);
    };

    const fetchRate = async (currencyId: string, targetDate: string) => {
        if (!currencyId) return 1;
        try {
            const res = await axios.get(`${API_BASE}/meta/currencies/${currencyId}/rate-at?date=${targetDate}`, getAuthHeader());
            return Number(res.data.rate);
        } catch (err) {
            console.error('Error fetching rate:', err);
            return 1;
        }
    };

    const refreshRates = async (targetDate: string) => {
        const baseCurr = currencies.find(c => c.isBase);
        const newLines = await Promise.all(lines.map(async (line) => {
            if (!line.currencyId || line.currencyCode === baseCurr?.code) return line;
            const rate = await fetchRate(line.currencyId, targetDate);
            return {
                ...line,
                exchangeRate: rate,
                baseDebit: Number(line.debit) * rate,
                baseCredit: Number(line.credit) * rate
            };
        }));
        setLines(newLines);
    };

    // Refresh rates when date changes
    useEffect(() => {
        if (view === 'form' && !isViewOnly && lines.some(l => l.currencyId)) {
            refreshRates(date);
        }
    }, [date]);

    const handleExportSingle = (entry: any) => {
        import('@/lib/exportUtils').then(({ exportToPDF }) => {
            const exportData = entry.lines.map((l: any) => ({
                account: l.account.code + ' - ' + l.account.name,
                debit: l.debit,
                credit: l.credit,
                currency: l.currency.code,
                exchangeRate: l.exchangeRate
            }));

            const totalDebit = entry.lines.reduce((sum: number, l: any) => sum + Number(l.debit), 0);
            const totalCredit = entry.lines.reduce((sum: number, l: any) => sum + Number(l.credit), 0);

            exportToPDF(
                exportData,
                `Payment_${entry.entryNumber}`,
                `سند صرف رقم: ${entry.entryNumber}`,
                ['الحساب', 'مدين', 'دائن', 'العملة'],
                ['account', 'debit', 'credit', 'currency'],
                `التاريخ: ${new Date(entry.date).toLocaleDateString('ar-AR')} | البيان: ${entry.description}`,
                {
                    debit: totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    credit: totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })
                }
            );
        });
    };

    const handleAddNew = () => {
        setIsViewOnly(false);
        resetForm();
        setView('form');
    };

    const handleEdit = (entry: any, viewOnly: boolean = false) => {
        setIsViewOnly(viewOnly);
        setEditingId(entry.id);
        setStatus(entry.status);
        setDescription(entry.description || '');
        setDate(new Date(entry.date).toISOString().split('T')[0]);
        setBranchId(entry.branchId || '');
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
            baseCredit: Number(l.baseCredit),
            costCenters: l.costCenters?.map((cc: any) => ({
                costCenterId: cc.costCenterId,
                percentage: Number(cc.percentage)
            })) || []
        })));
        setAttachments(entry.attachments || []);
        setView('form');
    };

    const updateLine = async (tempId: string, field: keyof JournalLine, value: any) => {
        const lineToUpdate = lines.find(l => l.tempId === tempId);
        if (!lineToUpdate) return;

        let updatedLine = { ...lineToUpdate, [field]: value };

        if (field === 'accountId') {
            const acc = accounts.find(a => a.id === value);
            if (acc) {
                updatedLine.currencyId = acc.currencyId;
                updatedLine.currencyCode = acc.currency.code;
                const rate = await fetchRate(acc.currencyId, date);
                updatedLine.exchangeRate = rate;
            }
        }

        if (field === 'debit' || field === 'credit' || field === 'exchangeRate' || field === 'accountId') {
            updatedLine.baseDebit = Number(updatedLine.debit) * Number(updatedLine.exchangeRate);
            updatedLine.baseCredit = Number(updatedLine.credit) * Number(updatedLine.exchangeRate);
        }

        setLines(lines.map(line => line.tempId === tempId ? updatedLine : line));
    };

    const handleSave = async (isPost: boolean = false) => {
        if (!isBalanced) return toast.error('السند غير متوازن');
        if (!description) return toast.error('يرجى إدخال البيان');
        if (branchId === '') return toast.error('يرجى اختيار الفرع');

        // Validation for Payments
        for (const line of lines) {
            const acc = accounts.find(a => a.id === line.accountId);
            if (!acc) continue;

            if ((acc.type === 'EXPENSE' || acc.type === 'LIABILITY') && Number(line.credit) > 0) {
                return toast.error(`الحساب ${acc.name} (مصروف/التزام) يجب أن يكون في الجانب المدين فقط في سند الصرف`);
            }
            if (acc.type === 'ASSET' && Number(line.debit) > 0) {
                return toast.error(`الحساب ${acc.name} (أصل) يجب أن يكون في الجانب الدائن فقط في سند الصرف`);
            }
        }

        setSaving(true);
        try {
            const payload = {
                branchId,
                description,
                type: 'PAYMENT',
                date: new Date(date).toISOString(),
                lines: lines.map(l => ({
                    accountId: l.accountId,
                    currencyId: l.currencyId,
                    debit: Number(l.debit),
                    credit: Number(l.credit),
                    exchangeRate: Number(l.exchangeRate),
                    baseDebit: Number(l.baseDebit),
                    baseCredit: Number(l.baseCredit),
                    costCenters: l.costCenters || []
                })),
                attachments: attachments.map(att => ({
                    fileName: att.fileName,
                    fileUrl: att.fileUrl,
                    fileType: att.fileType,
                    fileSize: att.fileSize
                }))
            };
            let res;
            if (editingId) {
                res = await axios.put(`${API_BASE}/journals/${editingId}`, payload, getAuthHeader());
            } else {
                res = await axios.post(`${API_BASE}/journals`, payload, getAuthHeader());
            }
            if (isPost) await axios.post(`${API_BASE}/journals/${res.data.id || editingId}/post`, {}, getAuthHeader());
            toast.success(isPost ? 'تم ترحيل السند' : 'تم حفظ السند');
            fetchEntries();
            setView('list');
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل الحفظ');
        } finally { setSaving(false); }
    };

    const handleUnpost = (id: string) => {
        askConfirm(
            {
                title: 'إلغاء ترحيل السند',
                description: 'هل أنت متأكد من إلغاء ترحيل هذا السند؟ سيعود السند إلى حالة المسودة ويمكن تعديله مرة أخرى.',
                variant: 'warning',
                icon: APP_ICONS.ACTIONS.UNDO,
                label: 'إلغاء الترحيل',
            },
            async () => {
                await axios.post(`${API_BASE}/journals/${id}/unpost`, {}, getAuthHeader());
                toast.success('تم إلغاء ترحيل السند بنجاح');
                fetchEntries();
                setIsViewOnly(false);
                setStatus('DRAFT');
            }
        );
    };

    const handleDelete = (id: string) => {
        askConfirm(
            {
                title: 'حذف سند الصرف',
                description: 'هل أنت متأكد من حذف هذا السند؟ لا يمكن التراجع عن هذه العملية.',
                variant: 'danger',
                icon: APP_ICONS.ACTIONS.DELETE,
                label: 'حذف السند',
            },
            async () => {
                await axios.delete(`${API_BASE}/journals/${id}`, getAuthHeader());
                toast.success('تم حذف السند بنجاح');
                fetchEntries();
            }
        );
    };

    const totalBaseDebit = lines.reduce((sum, l) => sum + Number(l.baseDebit), 0);
    const totalBaseCredit = lines.reduce((sum, l) => sum + Number(l.baseCredit), 0);
    const isBalanced = Math.abs(totalBaseDebit - totalBaseCredit) < 0.001;
    const hasAmounts = lines.some(l => Number(l.debit) > 0 || Number(l.credit) > 0);

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            id: 'reference',
            header: 'المرجع / الرقم',
            cell: ({ row }) => {
                const entry = row.original;
                const count = entry.attachments?.length || 0;
                return (
                    <div className="flex items-center gap-2">
                        <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-black", theme.muted, theme.accent)}>
                            {entry.entryNumber}
                        </div>
                        {count > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setViewAttachmentsEntry(entry); }}
                                className={cn("flex items-center gap-1 p-1 rounded-md transition-all opacity-60 hover:opacity-100", theme.accent, theme.muted.replace('bg-', 'hover:bg-'))}
                                title={`${count} مرفق(ات) - انقر للعرض`}
                            >
                                <APP_ICONS.ACTIONS.ATTACHMENT size={12} />
                            </button>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => <span className="font-mono text-muted-foreground/80">{new Date(row.original.date).toLocaleDateString('ar-AR')}</span>
        },
        {
            id: 'amounts',
            header: 'المبلغ',
            cell: ({ row }) => {
                const entry = row.original;
                const baseCurrency = currencies.find((c: any) => c.isBase);

                return (
                    <div className="flex flex-col gap-0.5 min-w-[100px]">
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-foreground/80 text-sm">
                                {Number(entry.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                                {baseCurrency?.code}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: 'description',
            header: 'البيان',
            cell: ({ row }) => <span className="font-bold text-foreground/90">{row.original.description}</span>
        },
        {
            accessorKey: 'status',
            header: 'الحالة',
            cell: ({ row }) => (
                <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    row.original.status === 'POSTED' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                    {row.original.status === 'POSTED' ? 'رحّــــــــل' : 'مســــودة'}
                </span>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const entry = row.original;
                return (
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {entry.status === 'POSTED' ? (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(entry, true)}
                                className="w-8 h-8 text-muted-foreground hover:text-foreground/80 hover:bg-accent dark:hover:bg-slate-800 rounded-xl transition-all"
                                title="عرض فقط"
                            >
                                <APP_ICONS.ACTIONS.VIEW size={14} />
                            </Button>
                        ) : (
                            <WithPermission permission="PAYMENT_EDIT">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(entry, false)}
                                    className="w-8 h-8 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                    title="تعديل"
                                >
                                    <APP_ICONS.ACTIONS.EDIT size={14} />
                                </Button>
                            </WithPermission>
                        )}

                        <WithPermission permission="PAYMENT_PRINT">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleExportSingle(entry)}
                                className="w-8 h-8 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                title="تصدير PDF"
                            >
                                <APP_ICONS.ACTIONS.EXPORT size={14} />
                            </Button>
                        </WithPermission>

                        {entry.status === 'POSTED' ? (
                            <WithPermission permission="PAYMENT_UNPOST">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleUnpost(entry.id)}
                                    className="w-8 h-8 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                                    title="إلغاء الترحيل (مدير فقط)"
                                >
                                    <APP_ICONS.ACTIONS.UNDO size={14} />
                                </Button>
                            </WithPermission>
                        ) : (
                            <WithPermission permission="PAYMENT_DELETE">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(entry.id)}
                                    className="w-8 h-8 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                    title="حذف"
                                >
                                    <APP_ICONS.ACTIONS.DELETE size={14} />
                                </Button>
                            </WithPermission>
                        )}
                    </div>
                );
            }
        }
    ], [theme, currencies]);

    const addLine = () => {
        setLines([...lines, { tempId: Math.random().toString(), accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0, costCenters: [] }]);
    };

    return (
        <ProtectedRoute permission="PAYMENT_VIEW">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
                <PageHeader
                    icon={APP_ICONS.MODULES.PAYMENTS}
                    title={view === 'list' ? 'سندات الصرف (Pagos)' : (isViewOnly ? 'تفاصيل سند صرف' : 'تحرير سند صرف')}
                    description="إدارة كافة المصاريف والمدفوعات المالية والتحقق من القيد المزدوج"
                >
                    {view === 'form' && editingId && (
                        <Button
                            onClick={() => {
                                const entry = entries.find(e => e.id === editingId);
                                if (entry) handleExportSingle(entry);
                            }}
                            variant="outline"
                            className={cn("flex items-center gap-2 rounded-2xl font-bold border-opacity-20", theme.accent.replace('text-', 'border-'), theme.accent, theme.muted.replace('bg-', 'hover:bg-'), "transition-all")}
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={20} className="ml-1" />
                            PDF
                        </Button>
                    )}
                    {view === 'list' ? (
                        <WithPermission permission="PAYMENT_CREATE">
                            <CustomButton onClick={handleAddNew} variant="primary">
                                <APP_ICONS.ACTIONS.ADD size={20} className="ml-2" />
                                إضافة سند صرف
                            </CustomButton>
                        </WithPermission>
                    ) : (
                        <CustomButton onClick={() => setView('list')} variant="primary">
                            <APP_ICONS.ACTIONS.CHEVRON_LEFT size={20} className="ml-2 rotate-180" />
                            العودة
                        </CustomButton>
                    )}
                </PageHeader>

                {view === 'list' ? (
                    <DataTable
                        columns={columns}
                        data={entries}
                        compact={true}
                        searchPlaceholder="بحث..."
                        exportFileName="payments-list"
                        noDataMessage={
                            <div className="flex flex-col items-center gap-3">
                                <IconBox icon={APP_ICONS.ACTIONS.LIST} className={cn("bg-accent text-muted-foreground/60 transition-colors", theme.muted.replace('bg-', 'group-hover:bg-'), theme.accent.replace('text-', 'group-hover:text-'))} boxSize="w-16 h-16" iconSize={32} />
                                <p className="text-muted-foreground/60 font-bold">لا توجد سندات مسجلة حالياً</p>
                            </div>}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3 bg-card p-8 rounded-[2rem] border border-input shadow-xl space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted-foreground/80 uppercase mr-1">الفرع</label>
                                    <Select disabled={isViewOnly} value={branchId} onValueChange={setBranchId}>
                                        <SelectTrigger className="h-12 bg-muted/50 rounded-xl border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent dir="rtl">{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted-foreground/80 uppercase mr-1">التاريخ</label>
                                    <Input type="date" disabled={isViewOnly} value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted-foreground/80 uppercase mr-1">البيان</label>
                                    <Input disabled={isViewOnly} value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 bg-muted/50 rounded-xl" />
                                </div>
                            </div>

                            <Table dir="rtl">
                                <TableHeader>
                                    <TableRow className={cn("hover:bg-opacity-90 border-none transition-all", theme.tableHeader)}>
                                        <TableHead className="text-right text-white font-black min-w-[250px] h-8 py-0 text-xs">الحساب</TableHead>
                                        <TableHead className="text-right text-white font-black min-w-[30px] h-8 py-0 text-xs">مركز التكلفة</TableHead>
                                        <TableHead className="text-center w-40 text-white font-black h-8 py-0 text-xs">مدين (+)</TableHead>
                                        <TableHead className="text-center w-40 text-white font-black h-8 py-0 text-xs">دائن (-)</TableHead>
                                        <TableHead className="w-8 text-white font-black h-8 py-0"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lines.map(line => (
                                        <TableRow key={line.tempId} className="group border-b border-border/40">
                                            <TableCell className="py-0.5 px-1.5">
                                                <SearchableAccountSelect
                                                    disabled={isViewOnly}
                                                    accounts={leafAccounts}
                                                    value={line.accountId}
                                                    onChange={(v: string) => updateLine(line.tempId, 'accountId', v)}
                                                    onAddNew={() => seIsActionModalOpen(true)}
                                                    className="h-7 text-[10px]"
                                                />
                                            </TableCell>
                                            <TableCell className="py-0.5 px-0.5">
                                                {(line.costCenters && line.costCenters.length > 0) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => !isViewOnly && setActiveLineForCc(line.tempId)}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-2 py-1 rounded-xl border transition-all text-[8px] font-black uppercase tracking-wider shadow-sm w-full h-7 justify-center",
                                                            theme.accent, "bg-primary/5 border-primary/20 hover:scale-105 active:scale-95"
                                                        )}
                                                    >
                                                        <APP_ICONS.NAV.COST_CENTERS size={10} />
                                                        {line.costCenters.length === 1 
                                                            ? (costCenters.find(c => c.id === line.costCenters[0].costCenterId)?.name || 'مركز')
                                                            : `${line.costCenters.length} مراكز (${line.costCenters.reduce((sum: number, c: any) => sum + c.percentage, 0)}%)`}
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => !isViewOnly && setActiveLineForCc(line.tempId)}
                                                        className={cn(
                                                            "w-full h-7 flex items-center justify-center rounded-xl border border-dashed transition-all group relative",
                                                            accounts.find(a => a.id === line.accountId)?.code?.match(/^[45]/)
                                                                ? "border-amber-400 bg-amber-50/50 text-amber-600 hover:border-amber-600 shadow-[0_0_10px_rgba(251,191,36,0.1)]"
                                                                : "border-muted-foreground/30 text-muted-foreground/40 hover:border-primary/50 hover:text-primary bg-muted/5"
                                                        )}
                                                        title={accounts.find(a => a.id === line.accountId)?.code?.match(/^[45]/) ? "يرجى تعيين مركز تكلفة لهذا الحساب" : ""}
                                                    >
                                                        {accounts.find(a => a.id === line.accountId)?.code?.match(/^[45]/) ? (
                                                            <APP_ICONS.STATE.WARNING size={12} className="animate-pulse" />
                                                        ) : (
                                                            <APP_ICONS.ACTIONS.ADD size={12} className="group-hover:rotate-90 transition-transform duration-300" />
                                                        )}
                                                    </button>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-0.5 px-0.5"><Input type="number" step="0.01" disabled={isViewOnly} value={line.debit || ''} onChange={(e) => updateLine(line.tempId, 'debit', Number(e.target.value))} className={cn("h-7 text-center text-[10px] font-bold focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))} /></TableCell>
                                            <TableCell className="py-0.5 px-0.5"><Input type="number" step="0.01" disabled={isViewOnly} value={line.credit || ''} onChange={(e) => updateLine(line.tempId, 'credit', Number(e.target.value))} className={cn("h-7 text-center text-[10px] font-bold focus-visible ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))} /></TableCell>
                                            <TableCell className="py-0.5 px-2 text-center">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={isViewOnly || lines.length <= 2}
                                                    onClick={() => setLines(lines.filter(l => l.tempId !== line.tempId))}
                                                    className="w-6 h-6 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <APP_ICONS.ACTIONS.DELETE size={10} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <Button variant="ghost" onClick={addLine} disabled={isViewOnly} className={cn("font-bold", theme.accent)}><APP_ICONS.ACTIONS.ADD size={16} className="ml-1" /> إضافة سطر</Button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-card p-6 rounded-[2rem] border border-input shadow-lg">
                                <AttachmentUpload
                                    attachments={attachments}
                                    onChange={setAttachments}
                                    disabled={isViewOnly}
                                    label="المرفقات والوثائق"
                                />
                            </div>
                            <div className="bg-card p-6 rounded-[2rem] border border-input shadow-lg space-y-4">
                                <div className="flex justify-between font-bold"><span>المدين:</span> <span>{totalBaseDebit.toLocaleString()}</span></div>
                                <div className="flex justify-between font-bold"><span>الدائن:</span> <span>{totalBaseCredit.toLocaleString()}</span></div>
                                <div className={cn("p-4 rounded-xl text-center font-black", isBalanced ? cn(theme.muted, theme.accent) : "bg-rose-50 text-rose-600")}>
                                    الفرق: {(totalBaseDebit - totalBaseCredit).toLocaleString()}
                                </div>
                                {!isViewOnly && (
                                    <>
                                        <WithPermission permission="PAYMENT_CREATE">
                                            <Button
                                                onClick={() => handleSave(false)}
                                                disabled={saving || !description || lines.some(l => !l.accountId) || !hasAmounts}
                                                variant="outline"
                                                className="w-full h-12 rounded-xl"
                                            >
                                                حفظ كمسودة
                                            </Button>
                                        </WithPermission>
                                        <WithPermission permission="PAYMENT_POST">
                                            <CustomButton
                                                onClick={() => handleSave(true)}
                                                disabled={!isBalanced || saving || !description || lines.some(l => !l.accountId) || !hasAmounts}
                                                className="w-full h-14"
                                            >
                                                ترحيل السند
                                            </CustomButton>
                                        </WithPermission>
                                    </>
                                )}
                                {isViewOnly && status === 'POSTED' && (
                                    <WithPermission permission="PAYMENT_UNPOST">
                                        <Button
                                            onClick={() => handleUnpost(editingId!)}
                                            variant="outline"
                                            className={cn("w-full h-14 rounded-2xl font-black border-amber-200 text-amber-600 hover:bg-amber-50 shadow-sm transition-all")}
                                        >
                                            <APP_ICONS.ACTIONS.UNDO size={20} className="ml-2" />
                                            إلغاء ترحيل السند
                                        </Button>
                                    </WithPermission>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {isActionModalOpen && (
                    <ActionModal
                        isOpen={true}
                        onClose={() => seIsActionModalOpen(false)}
                        title="إضافة حساب مالي"
                        description="يرجى ملء تفاصيل الحساب المالي بدقة."
                        icon={APP_ICONS.MODULES.ACCOUNTS}
                        maxWidth="max-w-2xl"
                        preventClose={true}
                        showCloseButton={false}
                    >
                        <AccountForm
                            accounts={accounts}
                            currencies={currencies}
                            branches={branches}
                            onClose={() => seIsActionModalOpen(false)}
                            onSave={fetchMeta}
                        />
                    </ActionModal>
                )}

                {/* Professional Confirmation Dialog */}
                <ConfirmModal
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

                <ViewAttachmentsModal
                    open={!!viewAttachmentsEntry}
                    onOpenChange={(open) => !open && setViewAttachmentsEntry(null)}
                    attachments={viewAttachmentsEntry?.attachments || []}
                    title={`مرفقات السند رقم: ${viewAttachmentsEntry?.entryNumber}`}
                />

                {activeLineForCc && (
                    <LineCostCenterModal
                        lineId={activeLineForCc}
                        currentDistributions={lines.find(l => l.tempId === activeLineForCc)?.costCenters || []}
                        costCenters={costCenters}
                        onSave={(dist) => updateLine(activeLineForCc, 'costCenters' as any, dist)}
                        onClose={() => setActiveLineForCc(null)}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

const PaymentsPageWrapper = () => (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className="w-12 h-12 text-rose-600 animate-spin" />
            <p className="text-muted-foreground/80 font-bold animate-pulse">جاري التحميل...</p>
        </div>
    }>
        <PaymentsPage />
    </Suspense>
);

export default PaymentsPageWrapper;
