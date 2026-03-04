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
    RotateCcw,
    Eye,
    Paperclip
} from 'lucide-react';
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
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { AccountModal } from '@/components/AccountModal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AttachmentUpload } from '@/components/AttachmentUpload';
import { ViewAttachmentsModal } from '@/components/ViewAttachmentsModal';
import { PermissionGuard } from '@/components/ui/PermissionGuard';
import { useAuth } from '@/context/AuthContext';
import { API_BASE, getAuthHeader } from '@/lib/api';

// Remove local API_BASE and getAuthHeader, now using imports from @/lib/api

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
    const { checkPermission } = useAuth();
    const canView = checkPermission('VOUCHERS_VIEW');
    const canCreate = checkPermission('VOUCHERS_CREATE');
    const canEdit = checkPermission('VOUCHERS_EDIT');
    const canDelete = checkPermission('VOUCHERS_DELETE');
    const canExport = checkPermission('VOUCHERS_EXPORT');

    const [view, setView] = useState<'list' | 'form'>('list');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);

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
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

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

    // Only leaf accounts (those without children) can be used in journal lines
    const leafAccounts = accounts.filter(a => !accounts.some(b => b.parentId === a.id));

    const searchParams = useSearchParams();
    const entryId = searchParams.get('id');

    useEffect(() => {
        fetchMeta();
        fetchEntries();
        if (entryId) {
            fetchEntryById(entryId);
        }
    }, [entryId]);

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
            const [accRes, branchRes, currRes] = await Promise.all([
                axios.get(`${API_BASE}/meta/accounts`, getAuthHeader()),
                axios.get(`${API_BASE}/meta/branches`, getAuthHeader()),
                axios.get(`${API_BASE}/meta/currencies`, getAuthHeader())
            ]);
            setAccounts(accRes.data);
            setBranches(branchRes.data);
            setCurrencies(currRes.data);
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
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setLines([
            { tempId: '1', accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0 },
            { tempId: '2', accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0 },
        ]);
        setAttachments([]);
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

    const handleAddNew = () => {
        setIsViewOnly(false);
        resetForm();
        setView('form');
    };

    const handleEdit = async (entry: any, viewOnly: boolean = false) => {
        setIsViewOnly(viewOnly);
        setEditingId(entry.id);
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
            baseCredit: Number(l.baseCredit)
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
            baseCredit: 0
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
                    baseCredit: Number(l.baseCredit)
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
                        description: 'القيد متوفر الآن في قائمة المسودات للتعديل.'
                    });
                    fetchEntries();
                    setConfirmDialog(prev => ({ ...prev, open: false }));
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
                `التاريخ: ${new Date(entry.date).toLocaleDateString('ar-DZ')} | الوصف: ${entry.description}`,
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
                accessorKey: 'entryNumber',
                header: 'رقم القيد',
                cell: ({ row }) => (
                    <div className="bg-blue-50 w-fit px-3 py-1 rounded-lg text-xs font-black text-blue-600">
                        {row.original.entryNumber}
                    </div>
                ),
            },
            {
                accessorKey: 'date',
                header: 'التاريخ',
                cell: ({ row }) => (
                    <span className="font-mono text-slate-500 text-sm">
                        {new Date(row.original.date).toLocaleDateString('ar-DZ')}
                    </span>
                ),
            },
            {
                id: 'attachments',
                header: '',
                cell: ({ row }) => {
                    const count = row.original.attachments?.length || 0;
                    if (count === 0) return null;
                    return (
                        <button
                            onClick={(e) => { e.stopPropagation(); setViewAttachmentsEntry(row.original); }}
                            className="flex items-center gap-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all"
                            title={`${count} مرفق(ات) - انقر للعرض`}
                        >
                            <Paperclip size={14} />
                            <span className="text-[10px] font-bold">{count}</span>
                        </button>
                    );
                }
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
                                        <span className="font-black text-indigo-600 text-sm">
                                            {Number(foreignLine.debit || foreignLine.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">
                                            {foreignLine.currency?.code}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 opacity-60">
                                        <span className="font-bold text-slate-500 text-[11px]">
                                            {Number(entry.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                                            {baseCurrency?.code}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-slate-700 text-sm">
                                        {Number(entry.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">
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
                    <span className="font-bold text-slate-800 line-clamp-1">{row.original.description}</span>
                ),
            },
            {
                accessorKey: 'branch.name',
                header: 'الفرع',
                cell: ({ row }) => (
                    <span className="italic text-slate-500 font-medium">{row.original.branch?.name}</span>
                ),
            },
            {
                accessorKey: 'status',
                header: () => <div className="text-center w-full">الحالة</div>,
                cell: ({ row }) => (
                    <div className="text-center h-full flex items-center justify-center border-r border-slate-100 pr-4 -mr-4">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest",
                            row.original.status === 'POSTED' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600 shadow-sm"
                        )}>
                            {row.original.status === 'POSTED' ? <Check size={12} /> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
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
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {/* View/Edit button - visible to all with VIEW, edit requires EDIT */}
                            {entry.status === 'POSTED' ? (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(entry, true)}
                                    className="w-10 h-10 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                    title="عرض فقط"
                                >
                                    <Eye size={18} />
                                </Button>
                            ) : canEdit ? (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(entry, false)}
                                    className="w-10 h-10 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all"
                                    title="تعديل"
                                >
                                    <Edit3 size={18} />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleEdit(entry, true)}
                                    className="w-10 h-10 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                    title="عرض فقط (لا تملك صلاحية التعديل)"
                                >
                                    <Eye size={18} />
                                </Button>
                            )}

                            {canExport && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleExportSingle(entry)}
                                    className="w-10 h-10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
                                    title="تصدير PDF"
                                >
                                    <Download size={18} />
                                </Button>
                            )}

                            {canDelete && (
                                entry.status === 'POSTED' ? (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleUnpost(entry.id)}
                                        className="w-10 h-10 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-xl transition-all"
                                        title="إلغاء الترحيل (مدير فقط)"
                                    >
                                        <RotateCcw size={18} />
                                    </Button>
                                ) : (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDelete(entry.id)}
                                        className="w-10 h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                                        title="حذف"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                )
                            )}
                        </div>
                    );
                },
            },
        ],
        []
    );

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
            <PageHeader
                icon={view === 'list' ? List : FilePlus2}
                title={view === 'list' ? 'دفتر اليومية العامة' : (editingId ? 'تعديل قيد يومية' : 'إنشاء قيد محاسبي')}
                description={view === 'list' ? 'استعرض وقم بإدارة كافة الحركات المالية المسجلة' : 'سجل التفاصيل بدقة وتأكد من توازن القيد بالعملة الأساسية'}
                iconClassName={view === 'list' ? "bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-200" : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-200"}
                className="mb-8"
            >
                {view === 'list' ? (
                    canCreate && (
                        <Button
                            onClick={handleAddNew}
                            className="bg-blue-600 hover:bg-blue-700  shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all hover:-translate-y-0.5"
                            size="lg"
                        >
                            <Plus size={20} className="mr-2" />
                            إضافة قيد جديد
                        </Button>
                    )
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
                                <Download size={20} className="mr-2" />
                                تصدير PDF
                            </Button>
                        )}
                        <Button
                            onClick={() => setView('list')}
                            variant="outline"
                            className="flex items-center gap-2 rounded-2xl font-bold transition-all"
                            size="lg"
                        >
                            <ChevronLeft size={20} className="mr-2 rotate-180" />
                            العودة للقائمة
                        </Button>
                    </div>
                )}
            </PageHeader>

            {view === 'list' ? (
                <div className="space-y-6">
                    {/* Table */}
                    <DataTable
                        columns={columns}
                        data={entries}
                        headerClassName="bg-blue-600"
                        searchPlaceholder="بحث برقم القيد أو الوصف..."
                        exportFileName="journal-entries"
                        noDataMessage={
                            <div className="flex flex-col items-center gap-3">
                                <IconBox icon={List} className="bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors" boxSize="w-16 h-16" iconSize={32} />
                                <p className="text-slate-400 font-bold">لا توجد قيود مسجلة حالياً</p>
                            </div>
                        }
                    />
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
                                    <Select disabled={isViewOnly} value={branchId} onValueChange={setBranchId}>
                                        <SelectTrigger className="h-12 bg-slate-50/50 rounded-2xl" dir="rtl">
                                            <SelectValue placeholder="اختر الفرع" />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                                        <Calendar size={16} className="text-blue-500" />
                                        تاريخ المعاملة
                                    </label>
                                    <Input
                                        type="date"
                                        disabled={isViewOnly}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="h-12 bg-slate-50/50 rounded-2xl font-mono font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-black text-slate-700 mr-1">
                                        <FileText size={16} className="text-blue-500" />
                                        وصف الحركة
                                    </label>
                                    <Input
                                        type="text"
                                        disabled={isViewOnly}
                                        placeholder="مثال: فاتورة مبيعات رقم..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="h-12 bg-slate-50/50 rounded-2xl font-bold"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto -mx-8">
                                <Table className="w-full text-right min-w-[800px]" dir="rtl">
                                    <TableHeader>
                                        <TableRow className="bg-blue-600 hover:bg-blue-700 border-none transition-all">
                                            <TableHead className="py-4 px-8 font-black text-right text-white">الحساب</TableHead>
                                            <TableHead className="py-4 px-2 font-black text-center w-32 text-white">مدين (+)</TableHead>
                                            <TableHead className="py-4 px-2 font-black text-center w-32 text-white">دائن (-)</TableHead>
                                            <TableHead className="py-4 px-2 font-black text-center w-24 text-white">العملة</TableHead>
                                            <TableHead className="py-4 px-2 font-black text-center w-32 text-white">سعر الصرف</TableHead>
                                            <TableHead className="py-4 px-8 w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-slate-50">
                                        {lines.map((line) => (
                                            <TableRow key={line.tempId} className="group hover:bg-blue-50/20 transition-all border-b-slate-50">
                                                <TableCell className="py-4 px-8">
                                                    <SearchableAccountSelect
                                                        disabled={isViewOnly}
                                                        accounts={leafAccounts}
                                                        value={line.accountId}
                                                        onChange={(val: string) => updateLine(line.tempId, 'accountId', val)}
                                                        onAddNew={() => setIsAccountModalOpen(true)}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4 px-2">
                                                    <Input
                                                        type="number"
                                                        disabled={isViewOnly}
                                                        placeholder="0.00"
                                                        className="w-full h-11 bg-slate-100/50 rounded-xl text-center font-mono font-bold focus:bg-white transition-colors border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                                                        value={line.debit > 0 ? line.debit : ''}
                                                        onChange={(e) => updateLine(line.tempId, 'debit', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4 px-2">
                                                    <Input
                                                        type="number"
                                                        disabled={isViewOnly}
                                                        placeholder="0.00"
                                                        className="w-full h-11 bg-slate-100/50 rounded-xl text-center font-mono font-bold focus:bg-white transition-colors border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                                                        value={line.credit > 0 ? line.credit : ''}
                                                        onChange={(e) => updateLine(line.tempId, 'credit', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4 px-2 text-center">
                                                    <div className="inline-flex h-10 w-16 items-center justify-center bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm flex-shrink-0 mx-auto">
                                                        {line.currencyCode}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-2">
                                                    <Input
                                                        type="number"
                                                        step="0.000001"
                                                        disabled={isViewOnly || line.currencyCode === 'SAR' || line.currencyCode === '---'}
                                                        className="w-full h-11 bg-slate-50 rounded-xl text-center font-mono font-bold disabled:opacity-50 focus:bg-white transition-colors border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
                                                        value={line.exchangeRate}
                                                        onChange={(e) => updateLine(line.tempId, 'exchangeRate', Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4 px-8 text-left">
                                                    {!isViewOnly && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => removeLine(line.tempId)}
                                                            className="w-10 h-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={18} />
                                                        </Button>
                                                    )}
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
                                    className="text-blue-600 font-bold"
                                >
                                    <Plus size={20} className="mr-2" />
                                    إضافة سطر
                                </Button>
                            )}
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

                        <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-lg">
                            <AttachmentUpload
                                attachments={attachments}
                                onChange={setAttachments}
                                disabled={isViewOnly}
                                label="المرفقات والوثائق"
                            />
                        </div>

                        {!isViewOnly && (
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-7 rounded-[2rem] text-white shadow-2xl border border-slate-800">
                                <div className="flex items-center gap-2 mb-6 text-blue-400">
                                    <RefreshCw size={20} className="animate-spin-slow" />
                                    <h3 className="font-black">الإجراءات النهائية</h3>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <Button
                                        disabled={saving || !description || !hasAmounts}
                                        onClick={() => handleSave(false)}
                                        variant="outline"
                                        className="w-full h-12 bg-transparent text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white rounded-2xl font-black transition-all"
                                    >
                                        {saving ? 'جاري الاتصال بالسيرفر...' : 'حفظ كمسودة'}
                                    </Button>
                                    <Button
                                        onClick={() => handleSave(true)}
                                        disabled={!isBalanced || lines.some(l => !l.accountId) || saving || !description || !hasAmounts}
                                        className={cn(
                                            "w-full h-14 rounded-2xl font-black text-base shadow-lg transition-all",
                                            isBalanced && !saving && description && hasAmounts ? "bg-blue-600 hover:bg-blue-700 shadow-blue-900/40" : "bg-slate-700 hover:bg-slate-700 text-slate-500 cursor-not-allowed"
                                        )}
                                    >
                                        <Check size={20} className="ml-2" />
                                        ترحيل القيد نهائياً
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {isAccountModalOpen && (
                <AccountModal
                    onClose={() => setIsAccountModalOpen(false)}
                    onSave={fetchMeta}
                    accounts={accounts}
                    currencies={currencies}
                    branches={branches}
                />
            )}
            <ConfirmationDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
                onConfirm={confirmDialog.onConfirm}
                isLoading={isActionLoading}
                title={confirmDialog.title}
                description={confirmDialog.description}
                variant={confirmDialog.variant}
                confirmText={confirmDialog.confirmText}
            />

            <ViewAttachmentsModal
                open={!!viewAttachmentsEntry}
                onOpenChange={(open) => !open && setViewAttachmentsEntry(null)}
                attachments={viewAttachmentsEntry?.attachments || []}
                title={`مرفقات قيد رقم: ${viewAttachmentsEntry?.entryNumber}`}
            />
        </div>
    );
};

const JournalPageWrapper = () => (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">جاري التحميل...</p>
        </div>
    }>
        <JournalPage />
    </Suspense>
);

export default JournalPageWrapper;
