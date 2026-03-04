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
    ChevronLeft,
    Building2,
    RotateCcw,
    FileText,
    Eye,
    TrendingUp,
    Download,
    ArrowDownToLine,
    AlertTriangle,
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
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AttachmentUpload } from '@/components/AttachmentUpload';
import { ViewAttachmentsModal } from '@/components/ViewAttachmentsModal';
import { useAuth } from '@/context/AuthContext';

const API_BASE = 'http://localhost:4000/api';
const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || 'mock-token'}` }
});

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
}

const PaymentsPage = () => {
    const { checkPermission } = useAuth();
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

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; variant: 'danger' | 'warning'; icon: any; label: string }>(
        { title: '', description: '', variant: 'danger', icon: AlertTriangle, label: '' }
    );
    const [confirmLoading, setConfirmLoading] = useState(false);

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
            toast.error('فشل في تحميل بيانات السند المخصص');
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
                `التاريخ: ${new Date(entry.date).toLocaleDateString('ar-DZ')} | البيان: ${entry.description}`,
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
                icon: RotateCcw,
                label: 'إلغاء الترحيل',
            },
            async () => {
                await axios.post(`${API_BASE}/journals/${id}/unpost`, {}, getAuthHeader());
                toast.success('تم إلغاء ترحيل السند بنجاح');
                fetchEntries();
            }
        );
    };

    const handleDelete = (id: string) => {
        askConfirm(
            {
                title: 'حذف سند الصرف',
                description: 'هل أنت متأكد من حذف هذا السند؟ لا يمكن التراجع عن هذه العملية.',
                variant: 'danger',
                icon: Trash2,
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
            accessorKey: 'entryNumber',
            header: 'رقم السند',
            cell: ({ row }) => <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-black">{row.original.entryNumber}</div>
        },
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => <span className="text-slate-500 text-sm">{new Date(row.original.date).toLocaleDateString('ar-DZ')}</span>
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
                        <Paperclip size={12} />
                        <span className="text-[10px] font-bold">{count}</span>
                    </button>
                );
            }
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
                            <span className="font-black text-slate-700 text-sm">
                                {Number(entry.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">
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
            cell: ({ row }) => <span className="font-bold text-slate-800">{row.original.description}</span>
        },
        {
            accessorKey: 'status',
            header: 'الحالة',
            cell: ({ row }) => (
                <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                    row.original.status === 'POSTED' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
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
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        {entry.status === 'POSTED' ? (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(entry, true)}
                                className="w-9 h-9 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                                title="عرض فقط"
                            >
                                <Eye size={16} />
                            </Button>
                        ) : canEdit ? (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(entry, false)}
                                className="w-9 h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all"
                                title="تعديل"
                            >
                                <Edit3 size={16} />
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEdit(entry, true)}
                                className="w-9 h-9 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                title="عرض فقط (لا تملك صلاحية التعديل)"
                            >
                                <Eye size={16} />
                            </Button>
                        )}

                        {canExport && (
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleExportSingle(entry)}
                                className="w-9 h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                                title="تصدير PDF"
                            >
                                <Download size={16} />
                            </Button>
                        )}

                        {canDelete && (
                            entry.status === 'POSTED' ? (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleUnpost(entry.id)}
                                    className="w-9 h-9 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-xl transition-all"
                                    title="إلغاء الترحيل (مدير فقط)"
                                >
                                    <RotateCcw size={16} />
                                </Button>
                            ) : (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDelete(entry.id)}
                                    className="w-9 h-9 text-rose-500 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                                    title="حذف"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            )
                        )}
                    </div>
                );
            }
        }
    ], []);

    const addLine = () => {
        setLines([...lines, { tempId: Math.random().toString(), accountId: '', currencyId: '', currencyCode: '---', debit: 0, credit: 0, exchangeRate: 1, baseDebit: 0, baseCredit: 0 }]);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <PageHeader
                icon={ArrowDownToLine}
                title={view === 'list' ? 'سندات الصرف (Pagos)' : 'تحرير سند صرف'}
                description="إدارة كافة المصاريف والمدفوعات المالية والتحقق من القيد المزدوج"
                iconClassName="bg-rose-600 shadow-rose-200"
            >
                {view === 'form' && editingId && canExport && (
                    <Button
                        onClick={() => {
                            const entry = entries.find(e => e.id === editingId);
                            if (entry) handleExportSingle(entry);
                        }}
                        variant="outline"
                        className="flex items-center gap-2 rounded-2xl font-bold border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                    >
                        <Download size={20} className="ml-1" />
                        PDF
                    </Button>
                )}
                {view === 'list' ? (
                    canCreate && (
                        <Button onClick={handleAddNew} className='bg-rose-600 hover:bg-rose-700  shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all hover:-translate-y-0.5'>
                            <Plus size={20} className="ml-2" />
                            إضافة سند صرف
                        </Button>
                    )
                ) : (
                    <Button onClick={() => setView('list')} className='bg-rose-600 hover:bg-rose-700  shadow-lg shadow-rose-200 hover:shadow-rose-300 transition-all hover:-translate-y-0.5'>
                        <ChevronLeft size={20} className="ml-2 rotate-180" />
                        العودة
                    </Button>
                )}
            </PageHeader>

            {view === 'list' ? (
                <DataTable columns={columns} data={entries} searchPlaceholder="بحث..." headerClassName="bg-rose-600" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase mr-1">الفرع</label>
                                <Select disabled={isViewOnly} value={branchId} onValueChange={setBranchId}>
                                    <SelectTrigger className="h-12 bg-slate-50 rounded-xl border-slate-100"><SelectValue /></SelectTrigger>
                                    <SelectContent dir="rtl">{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase mr-1">التاريخ</label>
                                <Input type="date" disabled={isViewOnly} value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-slate-50 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase mr-1">البيان</label>
                                <Input disabled={isViewOnly} value={description} onChange={(e) => setDescription(e.target.value)} className="h-12 bg-slate-50 rounded-xl" />
                            </div>
                        </div>

                        <Table dir="rtl">
                            <TableHeader>
                                <TableRow className="bg-rose-600 hover:bg-rose-700 border-none">
                                    <TableHead className="text-right text-white font-black">الحساب</TableHead>
                                    <TableHead className="text-center w-32 text-white font-black">مدين (+)</TableHead>
                                    <TableHead className="text-center w-32 text-white font-black">دائن (-)</TableHead>
                                    <TableHead className="w-10 text-white font-black"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lines.map(line => (
                                    <TableRow key={line.tempId} className="group">
                                        <TableCell>
                                            <SearchableAccountSelect
                                                disabled={isViewOnly}
                                                accounts={leafAccounts}
                                                value={line.accountId}
                                                onChange={(v: string) => updateLine(line.tempId, 'accountId', v)}
                                                onAddNew={() => setIsAccountModalOpen(true)}
                                            />
                                        </TableCell>
                                        <TableCell><Input type="number" step="0.01" disabled={isViewOnly} value={line.debit || ''} onChange={(e) => updateLine(line.tempId, 'debit', Number(e.target.value))} className="text-center font-bold" /></TableCell>
                                        <TableCell><Input type="number" step="0.01" disabled={isViewOnly} value={line.credit || ''} onChange={(e) => updateLine(line.tempId, 'credit', Number(e.target.value))} className="text-center font-bold" /></TableCell>
                                        <TableCell>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                disabled={isViewOnly || lines.length <= 2}
                                                onClick={() => setLines(lines.filter(l => l.tempId !== line.tempId))}
                                                className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Button variant="ghost" onClick={addLine} disabled={isViewOnly} className="text-rose-600 font-bold"><Plus size={16} className="ml-1" /> إضافة سطر</Button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg">
                            <AttachmentUpload
                                attachments={attachments}
                                onChange={setAttachments}
                                disabled={isViewOnly}
                                label="المرفقات والوثائق"
                            />
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg space-y-4">
                            <div className="flex justify-between font-bold"><span>المدين:</span> <span>{totalBaseDebit.toLocaleString()}</span></div>
                            <div className="flex justify-between font-bold"><span>الدائن:</span> <span>{totalBaseCredit.toLocaleString()}</span></div>
                            <div className={cn("p-4 rounded-xl text-center font-black", isBalanced ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                                الفرق: {(totalBaseDebit - totalBaseCredit).toLocaleString()}
                            </div>
                            {!isViewOnly && (
                                <>
                                    <Button
                                        onClick={() => handleSave(false)}
                                        disabled={saving || !description || lines.some(l => !l.accountId) || !hasAmounts}
                                        variant="outline"
                                        className="w-full h-12 rounded-xl"
                                    >
                                        حفظ كمسودة
                                    </Button>
                                    <Button
                                        onClick={() => handleSave(true)}
                                        disabled={!isBalanced || saving || !description || lines.some(l => !l.accountId) || !hasAmounts}
                                        className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-200"
                                    >
                                        ترحيل السند
                                    </Button>
                                </>
                            )}
                        </div>
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

            {/* Professional Confirmation Dialog */}
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

            <ViewAttachmentsModal
                open={!!viewAttachmentsEntry}
                onOpenChange={(open) => !open && setViewAttachmentsEntry(null)}
                attachments={viewAttachmentsEntry?.attachments || []}
                title={`مرفقات السند رقم: ${viewAttachmentsEntry?.entryNumber}`}
            />
        </div>
    );
};

const PaymentsPageWrapper = () => (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-rose-600 animate-spin" />
            <p className="text-slate-500 font-bold animate-pulse">جاري التحميل...</p>
        </div>
    }>
        <PaymentsPage />
    </Suspense>
);

export default PaymentsPageWrapper;
