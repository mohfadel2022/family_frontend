"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Shield,
    User,
    Search,
    Eye,
    Calendar,
    Lock,
    Unlock,
    FilePlus,
    Send,
    Trash2,
    FilterX,
    Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import { IconBox } from '@/components/ui/IconBox';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;
const AUTH_HEADER = getAuthHeader();

const AuditLogPage = () => {
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
            "العملية": log.action,
            "الهدف": log.entity,
            "معرف الهدف": log.entityId,
            "التاريخ والوقت": log.date,
            "التفاصيل": typeof log.details === 'object' ? JSON.stringify(log.details) : log.details
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

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'POST': return <Send size={14} className="text-emerald-500" />;
            case 'CREATE': return <FilePlus size={14} className="text-blue-500" />;
            case 'LOCK': return <Lock size={14} className="text-rose-500" />;
            default: return <Shield size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {selectedLogs.size > 0 && (
                <Button
                    onClick={handleBulkDelete}
                    variant="destructive"
                    className="z-100 fixed top-20 left-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-10 px-4 mr-3 flex items-center gap-2 transition-all shadow-md shadow-rose-500/20"
                >
                    <Trash2 size={16} />
                    حذف المحدد ({selectedLogs.size})
                </Button>
            )}
            {/* Standard Premium Header */}
            <PageHeader
                icon={Shield}
                title="سجل العمليات"
                description="Security Audit & Activity Logs"
                iconClassName="bg-gradient-to-br from-slate-800 to-slate-950 shadow-slate-200"
            >
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                        type="text"
                        placeholder="بحث في السجلات..."
                        className="pr-10 pl-4 py-2 bg-white border-slate-200 rounded-xl focus-visible:ring-blue-500 w-56 text-xs font-bold h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                </div>
            </PageHeader>

            {/* Advanced Filters Bar */}
            <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-100 shadow-xl shadow-blue-500/5 flex flex-wrap gap-3 items-center" dir="rtl">
                <div className="w-full md:w-auto min-w-[150px]">
                    <Select value={filterAction} onValueChange={setFilterAction}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-100 rounded-xl font-bold" dir="rtl">
                            <SelectValue placeholder="تصفية حسب العملية..." />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all">كل العمليات</SelectItem>
                            {uniqueActions.map((action: any) => (
                                <SelectItem key={action} value={action}>{action}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                type="date"
                                className="h-11 pl-4 pr-10 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-600 text-xs w-[140px]"
                                value={filterStartDate}
                                onChange={e => setFilterStartDate(e.target.value)}
                                title="من تاريخ (From)"
                            />
                        </div>
                        <span className="text-slate-300 font-bold">-</span>
                        <div className="relative">
                            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                type="date"
                                className="h-11 pl-4 pr-10 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-600 text-xs w-[140px]"
                                value={filterEndDate}
                                onChange={e => setFilterEndDate(e.target.value)}
                                title="إلى تاريخ (To)"
                            />
                        </div>
                    </div>
                </div>

                {(filterAction !== 'all' || filterStartDate !== '' || filterEndDate !== '') && (
                    <Button
                        variant="ghost"
                        onClick={() => { setFilterAction('all'); setFilterStartDate(''); setFilterEndDate(''); }}
                        className="h-11 text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold px-4"
                    >
                        <FilterX size={16} className="mr-2" />
                        مسح الفلاتر
                    </Button>
                )}

                <div className="flex-1 md:flex-none md:mr-auto w-full md:w-auto mt-2 md:mt-0">
                    <Button
                        variant="outline"
                        onClick={handleExportExcel}
                        className="h-11 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200 font-black rounded-xl w-full"
                    >
                        <Download size={16} className="ml-2" />
                        تصدير Excel (الفترة المحددة)
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <Table className="w-full text-right" dir="rtl">
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                        <TableRow className="hover:bg-slate-50/50 border-none">
                            <TableHead className="py-3 px-4 w-12 text-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    checked={filteredLogs.length > 0 && selectedLogs.size === filteredLogs.length}
                                    onChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">المستخدم</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">العملية</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">الهدف</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">التاريخ والوقت</TableHead>
                            <TableHead className="py-3 px-6 text-slate-500 text-[10px] uppercase tracking-widest font-black text-right">التفاصيل</TableHead>
                            <TableHead className="py-3 px-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-50">
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-400 font-bold">جاري تحميل السجلات...</TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-slate-400 font-bold">لم يتم العثور على سجلات مطابقة</TableCell>
                            </TableRow>
                        ) : filteredLogs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors group border-b-slate-50">
                                <TableCell className="py-3 px-4 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={selectedLogs.has(log.id)}
                                        onChange={() => toggleSelect(log.id)}
                                    />
                                </TableCell>
                                <TableCell className="py-3 px-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <User size={14} />
                                        </div>
                                        <span className="font-bold text-slate-800 text-xs">{log.user}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 px-6">
                                    <div className="flex items-center gap-2">
                                        {getActionIcon(log.action)}
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{log.action}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 px-6">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase">
                                        {log.entity}: {log.entityId}
                                    </span>
                                </TableCell>
                                <TableCell className="py-3 px-6 text-slate-500 text-[11px] font-mono">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        <span dir="ltr">{log.date}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-3 px-6 text-slate-600 text-[11px] max-w-xs truncate font-medium">
                                    {log.details && typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                                </TableCell>
                                <TableCell className="py-3 px-6 text-left">
                                    <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setViewingLog(log)}
                                            className="w-8 h-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors p-0 rounded-full"
                                        >
                                            <Eye size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(log.id)}
                                            className="w-8 h-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors p-0 rounded-full"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                <p className="text-amber-800 text-[11px] font-black opacity-80">
                    يمكن للمسؤولين المعتمدين فقط حذف السجلات بشكل نهائي. الحذف هو إجراء دائم.
                </p>
            </div>

            {viewingLog && (
                <Dialog open={true} onOpenChange={(open) => !open && setViewingLog(null)}>
                    <DialogContent className="max-w-xl bg-white p-0 overflow-hidden border-slate-100 rounded-[2.5rem]" dir="rtl">
                        <DialogHeader className="p-8 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100">
                            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <Shield className="text-slate-600" />
                                تفاصيل السجل
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">المستخدم</div>
                                    <div className="font-bold text-sm text-slate-800">{viewingLog.user}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">الوقت والتاريخ</div>
                                    <div className="font-bold text-sm text-slate-800" dir="ltr">{viewingLog.date}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">العملية الهدف</div>
                                    <div className="font-bold text-sm text-slate-800">{viewingLog.action} - {viewingLog.entity} ({viewingLog.entityId})</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">البيانات الإضافية (JSON)</div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-mono text-slate-600 overflow-x-auto">
                                    <pre>{typeof viewingLog.details === 'object' ? JSON.stringify(viewingLog.details, null, 2) : viewingLog.details}</pre>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <ConfirmDialog
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
    );
};

export default AuditLogPage;
