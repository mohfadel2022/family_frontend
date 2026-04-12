"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { IconBox } from '@/components/ui/IconBox';
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
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import { useAuth } from '@/context/AuthContext';
import { API_BASE, META_BASE, COST_CENTER_BASE, getAuthHeader } from '@/lib/api';
import { CustomButton } from '@/components/ui/CustomButton';
import { usePageTheme } from '@/hooks/usePageTheme';
import { LineCostCenterModal } from '@/components/vouchers/LineCostCenterModal';

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

const JournalPage = () => {
    const theme = usePageTheme();
    const { checkPermission } = useAuth();
    const canView = checkPermission('JOURNAL_VIEW');

    const [view, setView] = useState<'list' | 'form'>('list');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [entryNumber, setEntryNumber] = useState<string | null>(null);

    // Form State
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [branchId, setBranchId] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([]);
    const [attachments, setAttachments] = useState<any[]>([]);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [costCenters, setCostCenters] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [isActionModalOpen, seIsActionModalOpen] = useState(false);

    // Attachment Viewer State
    const [viewAttachmentsEntry, setViewAttachmentsEntry] = useState<any>(null);

    // Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        variant: "default" | "destructive" | "warning" | "success";
        onConfirm: () => void;
        confirmText: string;
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'default',
        onConfirm: () => { },
        confirmText: 'تأكيد'
    });
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [activeLineForCc, setActiveLineForCc] = useState<string | null>(null);

    const leafAccounts = accounts.filter(a => !accounts.some(b => b.parentId === a.id));

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
            toast.error('فشل في تحميل بيانات القيد المخصص');
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
            const res = await axios.get(`${API_BASE}/journals?type=GENERAL`, getAuthHeader());
            setEntries(res.data);
        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل سجل القيود');
        }
        finally { setLoading(false); }
    };

    const resetForm = () => {
        setEditingId(null);
        setEntryNumber(null);
        setDescription('');
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

    useEffect(() => {
        if (view === 'form' && !isViewOnly && lines.some(l => l.currencyId)) {
            refreshRates(date);
        }
    }, [date]);

    const handleAddNew = () => {
        setIsViewOnly(false);
        resetForm();
        setView('form');
    };

    const handleEdit = async (entry: any, viewOnly: boolean = false) => {
        setIsViewOnly(viewOnly);
        setEditingId(entry.id);
        setEntryNumber(entry.entryNumber);
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
            baseCredit: 0,
            costCenters: []
        }]);
    };

    const removeLine = (tempId: string) => {
        if (lines.length > 2) {
            setLines(lines.filter(l => l.tempId !== tempId));
        }
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
        } else if (field === 'currencyId') {
            const curr = currencies.find(c => c.id === value);
            if (curr) {
                updatedLine.currencyCode = curr.code;
                const rate = await fetchRate(value, date);
                updatedLine.exchangeRate = rate;
            }
        }

        if (field === 'debit' || field === 'exchangeRate' || field === 'accountId' || field === 'currencyId') {
            updatedLine.baseDebit = Number(updatedLine.debit) * Number(updatedLine.exchangeRate);
        }
        if (field === 'credit' || field === 'exchangeRate' || field === 'accountId' || field === 'currencyId') {
            updatedLine.baseCredit = Number(updatedLine.credit) * Number(updatedLine.exchangeRate);
        }

        setLines(lines.map(line => line.tempId === tempId ? updatedLine : line));
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
                type: 'GENERAL',
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

            if (isPost) {
                await axios.post(`${API_BASE}/journals/${res.data.id || editingId}/post`, {}, getAuthHeader());
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
        setConfirmDialog({
            open: true,
            title: 'إلغاء ترحيل القيد',
            description: 'هل أنت متأكد من إلغاء ترحيل هذا القيد؟ سيعود القيد إلى حالة المسودة ويمكنك التعديل عليه مرة أخرى.',
            variant: 'warning',
            confirmText: 'إلغاء الترحيل',
            onConfirm: async () => {
                setIsActionLoading(true);
                try {
                    await axios.post(`${API_BASE}/journals/${id}/unpost`, {}, getAuthHeader());
                    toast.success('تم إلغاء ترحيل القيد بنجاح', {
                        description: 'يمكنك الآن تعديل القيد مباشرة.'
                    });
                    fetchEntries();
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    setIsViewOnly(false);
                    setStatus('DRAFT');
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'فشل في إلغاء الترحيل');
                } finally {
                    setIsActionLoading(false);
                }
            }
        });
    };

    const handleDelete = async (id: string) => {
        setConfirmDialog({
            open: true,
            title: 'حذف القيد المحاسبي',
            description: 'هل أنت متأكد من حذف هذا القيد؟ لا يمكن التراجع عن هذه العملية بعد إتمامها.',
            variant: 'destructive',
            confirmText: 'حذف نهائي',
            onConfirm: async () => {
                setIsActionLoading(true);
                try {
                    await axios.delete(`${API_BASE}/journals/${id}`, getAuthHeader());
                    toast.success('تم حذف القيد بنجاح', {
                        description: 'تمت إزالة كافة أسطر القيد من سجلات النظام.'
                    });
                    fetchEntries();
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                } catch (err: any) {
                    toast.error(err.response?.data?.error || 'فشل الحذف');
                } finally {
                    setIsActionLoading(false);
                }
            }
        });
    };

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
                `Voucher_${entry.entryNumber}`,
                `قيد يومية رقم: ${entry.entryNumber}`,
                ['الحساب', 'مدين', 'دائن', 'العملة', 'سعر الصرف'],
                ['account', 'debit', 'credit', 'currency', 'exchangeRate'],
                `التاريخ: ${new Date(entry.date).toLocaleDateString('ar-AR')} | الوصف: ${entry.description}`,
                {
                    debit: totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                    credit: totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })
                }
            );
        });
    };

    const totalBaseDebit = lines.reduce((sum, l) => sum + Number(l.baseDebit), 0);
    const totalBaseCredit = lines.reduce((sum, l) => sum + Number(l.baseCredit), 0);
    const isBalanced = Math.abs(totalBaseDebit - totalBaseCredit) < 0.001;
    const hasAmounts = lines.some(l => Number(l.debit) > 0 || Number(l.credit) > 0);

    const columns = React.useMemo<ColumnDef<any>[]>(
        () => [
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
                cell: ({ row }) => (
                    <span className="font-mono text-muted-foreground/80">
                        {new Date(row.original.date).toLocaleDateString('ar-AR')}
                    </span>
                ),
            },
            {
                id: 'amounts',
                header: 'المبلغ / المعادل',
                cell: ({ row }) => {
                    const entry = row.original;
                    const foreignLine = entry.lines?.find((l: any) => !l.currency?.isBase);
                    const baseCurrency = currencies.find((c: any) => c.isBase);

                    return (
                        <div className="flex flex-col gap-0.5 min-w-[100px]">
                            {foreignLine ? (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn("font-black text-sm", theme.accent)}>
                                            {(Number(foreignLine.debit) || Number(foreignLine.credit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                                            {foreignLine.currency?.code}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <span className="font-bold text-muted-foreground/80 text-[11px]">
                                            {Number(entry.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                                            {baseCurrency?.code}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-foreground/80 text-sm">
                                        {Number(entry.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase">
                                        {baseCurrency?.code}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                accessorKey: 'description',
                header: 'البيان / الوصف',
                cell: ({ row }) => (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground/90 line-clamp-1">{row.original.description}</span>
                        {row.original.branch?.name && (
                            <span className="text-[9px] italic text-muted-foreground/60 font-medium">{row.original.branch.name}</span>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: () => <div className="text-center w-full">الحالة</div>,
                cell: ({ row }) => (
                    <div className="text-center h-full flex items-center justify-center border-r border-border pr-2 -mr-2">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                            row.original.status === 'POSTED' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm"
                        )}>
                            {row.original.status === 'POSTED' ? <APP_ICONS.ACTIONS.CHECK size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>}
                            {row.original.status === 'POSTED' ? 'رحّــــــــل' : 'مســــودة'}
                        </span>
                    </div>
                ),
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
                                <WithPermission permission="JOURNAL_EDIT">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleEdit(entry, false)}
                                        className="w-8 h-8 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                        title="تعديل"
                                    >
                                        <APP_ICONS.ACTIONS.EDIT size={14} />
                                    </Button>
                                </WithPermission>
                            )}
 
                            <WithPermission permission="JOURNAL_PRINT">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleExportSingle(entry)}
                                    className="w-8 h-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
                                    title="تصدير PDF"
                                >
                                    <APP_ICONS.ACTIONS.EXPORT size={14} />
                                </Button>
                            </WithPermission>
 
                            {entry.status === 'POSTED' ? (
                                <WithPermission permission="JOURNAL_UNPOST">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleUnpost(entry.id)}
                                        className="w-8 h-8 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl transition-all"
                                        title="إلغاء الترحيل"
                                    >
                                        <APP_ICONS.ACTIONS.UNDO size={14} />
                                    </Button>
                                </WithPermission>
                            ) : (
                                <WithPermission permission="JOURNAL_DELETE">
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
                },
            },
        ],
        [theme, currencies]
    );

    if (loading && view === 'list') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-bold animate-pulse">جاري تحميل القيود اليومية...</p>
            </div>
        );
    }

    return (
        <ProtectedRoute permission="JOURNAL_VIEW">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <PageHeader
                    icon={view === 'list' ? APP_ICONS.ACTIONS.LIST : APP_ICONS.MODULES.JOURNAL}
                    title={view === 'list' ? 'دفتر اليومية العامة' : (isViewOnly ? `تفاصيل قيد يومية ${entryNumber ? `#${entryNumber}` : ''}` : (editingId ? `تعديل قيد يومية ${entryNumber ? `#${entryNumber}` : ''}` : 'إنشاء قيد محاسبي'))}
                    description={view === 'list' ? 'استعرض وقم بإدارة كافة الحركات المالية المسجلة' : 'سجل التفاصيل بدقة وتأكد من توازن القيد بالعملة الأساسية'}
                    className="mb-8"
                >
                    {view === 'list' ? (
                        <WithPermission permission="JOURNAL_CREATE">
                            <CustomButton
                                onClick={handleAddNew}
                                icon={APP_ICONS.ACTIONS.ADD}
                                variant="primary"
                                isLoading={false}
                            >
                                إضافة قيد جديد
                            </CustomButton>
                        </WithPermission>
                    ) : (
                        <div className="flex gap-2">
                            {editingId && (
                                <Button
                                    onClick={() => {
                                        const entry = entries.find(e => e.id === editingId);
                                        if (entry) handleExportSingle(entry);
                                    }}
                                    variant="outline"
                                    className="flex items-center gap-2 rounded-2xl font-bold border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all"
                                    size="lg"
                                >
                                    <APP_ICONS.ACTIONS.EXPORT size={20} className="mr-2" />
                                    تصدير PDF
                                </Button>
                            )}
                            <Button
                                onClick={() => setView('list')}
                                variant="outline"
                                className="flex items-center gap-2 rounded-2xl font-bold transition-all"
                                size="lg"
                            >
                                <APP_ICONS.ACTIONS.CHEVRON_LEFT size={20} className="mr-2 rotate-180" />
                                العودة للقائمة
                            </Button>
                        </div>
                    )}
                </PageHeader>

                {view === 'list' ? (
                    <div className="space-y-6">
                        <DataTable
                            columns={columns}
                            data={entries}
                            compact={true}
                            searchPlaceholder="بحث برقم القيد أو الوصف..."
                            exportFileName="journal-list"
                            noDataMessage={
                                <div className="flex flex-col items-center gap-3">
                                    <IconBox icon={APP_ICONS.ACTIONS.LIST} className="bg-accent text-muted-foreground/60 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors" boxSize="w-16 h-16" iconSize={32} />
                                    <p className="text-muted-foreground/60 font-bold">لا توجد قيود مسجلة حالياً</p>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-card p-8 rounded-[2rem] border border-input shadow-2xl shadow-blue-500/5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-black text-foreground/80 mr-1">
                                            <APP_ICONS.MODULES.ENTITIES size={16} className={theme.accent} />
                                            الفرع المحاسبي
                                        </label>
                                        <Select disabled={isViewOnly} value={branchId} onValueChange={setBranchId}>
                                            <SelectTrigger className="h-12 bg-muted/30 rounded-2xl" dir="rtl">
                                                <SelectValue placeholder="اختر الفرع" />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl">
                                                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-black text-foreground/80 mr-1">
                                            <APP_ICONS.ACTIONS.CALENDAR size={16} className={theme.accent} />
                                            تاريخ المعاملة
                                        </label>
                                        <Input
                                            type="date"
                                            disabled={isViewOnly}
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-12 bg-muted/30 rounded-2xl font-mono font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-sm font-black text-foreground/80 mr-1">
                                            <APP_ICONS.REPORTS.ACCOUNT_STATEMENT size={16} className={theme.accent} />
                                            وصف الحركة
                                        </label>
                                        <Input
                                            type="text"
                                            disabled={isViewOnly}
                                            placeholder="مثال: فاتورة مبيعات رقم..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="h-12 bg-muted/30 rounded-2xl font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto -mx-8">
                                    <Table className="w-full text-right min-w-[800px]" dir="rtl">
                                        <TableHeader>
                                            <TableRow className={cn("hover:bg-opacity-90 border-none transition-all", theme.tableHeader)}>
                                                <TableHead className="h-8 py-0 px-3 font-black text-right text-white min-w-[250px] text-xs">الحساب</TableHead>
                                                <TableHead className="h-8 py-0 px-1 font-black text-right text-white min-w-[150px] text-xs">مركز التكلفة</TableHead>
                                                <TableHead className="h-8 py-0 px-1 font-black text-center w-24 text-white text-xs">مدين (+)</TableHead>
                                                <TableHead className="h-8 py-0 px-1 font-black text-center w-24 text-white text-xs">دائن (-)</TableHead>
                                                <TableHead className="h-8 py-0 px-1 font-black text-center w-20 text-white text-xs">العملة</TableHead>
                                                <TableHead className="h-8 py-0 px-1 font-black text-center w-28 text-white text-xs">سعر الصرف</TableHead>
                                                <TableHead className="h-8 py-0 px-3 w-8"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-slate-50">
                                            {lines.map((line) => (
                                                <TableRow key={line.tempId} className={cn("group transition-all border-b border-border/40", theme.muted.replace('bg-', 'hover:bg-'))}>
                                                    <TableCell className="py-0.5 px-1.5">
                                                        <SearchableAccountSelect
                                                            disabled={isViewOnly}
                                                            accounts={leafAccounts}
                                                            value={line.accountId}
                                                            onChange={(val: string) => updateLine(line.tempId, 'accountId', val)}
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
                                                                    <>
                                                                        <APP_ICONS.STATE.WARNING size={12} className="animate-pulse" />
                                                                        <span className="sr-only text-[6px] font-black absolute -top-2 bg-amber-500 text-white px-1 rounded">تنبيه</span>
                                                                    </>
                                                                ) : (
                                                                    <APP_ICONS.ACTIONS.ADD size={12} className="group-hover:rotate-90 transition-transform duration-300" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-0.5 px-0.5">
                                                        <Input
                                                            type="number"
                                                            disabled={isViewOnly}
                                                            placeholder="0.00"
                                                            className="w-full h-7 bg-accent/50 rounded-xl text-center font-mono font-bold focus:bg-card transition-colors border-0 focus-visible:ring-2 focus-visible:ring-blue-500 text-[10px]"
                                                            value={line.debit > 0 ? line.debit : ''}
                                                            onChange={(e) => updateLine(line.tempId, 'debit', Number(e.target.value))}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-0.5 px-0.5">
                                                        <Input
                                                            type="number"
                                                            disabled={isViewOnly}
                                                            placeholder="0.00"
                                                            className={cn("w-full h-7 bg-accent/50 rounded-xl text-center font-mono font-bold focus:bg-card transition-colors border-0 focus-visible:ring-2 text-[10px]", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                                            value={line.credit > 0 ? line.credit : ''}
                                                            onChange={(e) => updateLine(line.tempId, 'credit', Number(e.target.value))}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-0.5 px-1 text-center">
                                                        <div className="inline-flex h-6 w-12 items-center justify-center bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-sm flex-shrink-0 mx-auto">
                                                            {line.currencyCode}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-0.5 px-1">
                                                        <Input
                                                            type="number"
                                                            disabled={isViewOnly || (accounts.find(a => a.id === line.accountId)?.currency.isBase)}
                                                            placeholder="1.00"
                                                            className="w-full h-7 bg-accent/50 rounded-xl text-center font-mono font-bold focus:bg-card transition-colors border-0 focus-visible:ring-2 focus-visible:ring-blue-500 text-[10px]"
                                                            value={line.exchangeRate || ''}
                                                            onChange={(e) => updateLine(line.tempId, 'exchangeRate', Number(e.target.value))}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-0.5 px-2 text-center">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            disabled={isViewOnly || lines.length <= 2}
                                                            onClick={() => removeLine(line.tempId)}
                                                            className="w-6 h-6 opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <APP_ICONS.ACTIONS.DELETE size={10} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {!isViewOnly && (
                                    <Button
                                        onClick={addLine}
                                        variant="ghost"
                                        className={cn("mt-4 font-bold", theme.accent)}
                                    >
                                        <APP_ICONS.ACTIONS.ADD size={20} className="mr-2" />
                                        إضافة سطر
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Summary Sidebar */}
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
                                <div className="flex justify-between font-bold"><span>المدين الكلي:</span> <span className="font-mono">{totalBaseDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                <div className="flex justify-between font-bold"><span>الدائن الكلي:</span> <span className="font-mono">{totalBaseCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                <div className={cn("p-4 rounded-xl text-center font-black", isBalanced ? cn(theme.muted, theme.accent) : "bg-rose-50 text-rose-600")}>
                                    الفرق: {(totalBaseDebit - totalBaseCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>

                                {!isViewOnly && (
                                    <>
                                        <WithPermission permission="JOURNAL_CREATE">
                                            <Button
                                                onClick={() => handleSave(false)}
                                                disabled={saving || !description || lines.some(l => !l.accountId) || !hasAmounts}
                                                variant="outline"
                                                className="w-full h-12 rounded-xl"
                                            >
                                                {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                                            </Button>
                                        </WithPermission>
                                        <WithPermission permission="JOURNAL_POST">
                                            <Button
                                                onClick={() => handleSave(true)}
                                                disabled={!isBalanced || saving || !description || lines.some(l => !l.accountId) || !hasAmounts}
                                                className={cn("w-full h-14 text-white rounded-xl shadow-lg", theme.primary, theme.shadow)}
                                            >
                                                {saving ? 'جاري الترحيل...' : 'ترحيل القيد'}
                                            </Button>
                                        </WithPermission>
                                    </>
                                )}
                                {isViewOnly && status === 'POSTED' && (
                                    <WithPermission permission="JOURNAL_UNPOST">
                                        <Button
                                            onClick={() => handleUnpost(editingId!)}
                                            variant="outline"
                                            className={cn("w-full h-14 rounded-2xl font-black border-amber-200 text-amber-600 hover:bg-amber-50 shadow-sm transition-all")}
                                        >
                                            <APP_ICONS.ACTIONS.UNDO size={20} className="ml-2" />
                                            إلغاء ترحيل القيد
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
                <ConfirmModal
                    open={confirmDialog.open}
                    onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                    onConfirm={confirmDialog.onConfirm}
                    loading={isActionLoading}
                    title={confirmDialog.title}
                    description={confirmDialog.description}
                    variant={confirmDialog.variant as any}
                    confirmLabel={confirmDialog.confirmText}
                />

                <ViewAttachmentsModal
                    open={!!viewAttachmentsEntry}
                    onOpenChange={(open) => !open && setViewAttachmentsEntry(null)}
                    attachments={viewAttachmentsEntry?.attachments || []}
                    title={`مرفقات قيد رقم: ${viewAttachmentsEntry?.entryNumber}`}
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

const JournalPageWrapper = () => (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <APP_ICONS.STATE.LOADING className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-muted-foreground/80 font-bold animate-pulse">جاري التحميل...</p>
        </div>
    }>
        <JournalPage />
    </Suspense>
);

export default JournalPageWrapper;
