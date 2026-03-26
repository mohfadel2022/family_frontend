"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
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
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ActionModal } from '@/components/ui/ActionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuth } from '@/context/AuthContext';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;

// --- Subcomponent: Edit Modal ---
const EditHistoryModal = ({ history, onClose, onSave }: any) => {
    const theme = usePageTheme();
    const [rate, setRate] = useState(history?.rate || '');
    const [date, setDate] = useState(history?.date ? new Date(history.date).toISOString().split('T')[0] : '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.put(`${API_BASE}/currencies/history/${history.id}`, { rate, date }, getAuthHeader());
            toast.success('تم تحديث السعر بنجاح');
            onSave();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'فشل التحديث');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ActionModal
            isOpen={true}
            onClose={onClose}
            title="تعديل سجل العملة"
            description="قم بتعديل سعر الصرف أو التاريخ لهذا السجل."
            icon={APP_ICONS.ACTIONS.EDIT}
        >
            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase mr-1">سعر الصرف</label>
                    <Input 
                        type="number" 
                        step="0.0001"
                        value={rate} 
                        onChange={(e) => setRate(e.target.value)} 
                        className="h-12 rounded-2xl font-black"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase mr-1">التاريخ</label>
                    <Input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="h-12 rounded-2xl font-black"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <CustomButton variant="outline" onClick={onClose} className="flex-1 h-12">إلغاء</CustomButton>
                    <CustomButton 
                        variant="primary" 
                        onClick={handleSave} 
                        isLoading={loading}
                        className="flex-[2] h-12"
                    >
                        حفظ التعديلات
                    </CustomButton>
                </div>
            </div>
        </ActionModal>
    );
};

const CurrencyHistoryReport = () => {
    const theme = usePageTheme();
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<string>('');
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingCurrencies, setFetchingCurrencies] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { checkPermission } = useAuth();
    const canEdit = checkPermission('CURRENCIES_EDIT');

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const res = await axios.get(`${API_BASE}/currencies`, getAuthHeader());
                const foreignOnly = res.data.filter((c: any) => !c.isBase);
                setCurrencies(foreignOnly);
                if (foreignOnly.length > 0) {
                    setSelectedCurrency(foreignOnly[0].id);
                }
            } catch (err) {
                toast.error('فشل تحميل العملات');
            } finally {
                setFetchingCurrencies(false);
            }
        };
        fetchCurrencies();
    }, []);

    const fetchHistory = async () => {
        if (!selectedCurrency) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/currencies/${selectedCurrency}/history`, getAuthHeader());
            let filtered = res.data;

            if (startDate) {
                const sDate = new Date(startDate);
                filtered = filtered.filter((h: any) => new Date(h.date) >= sDate);
            }
            if (endDate) {
                const eDate = new Date(endDate);
                filtered = filtered.filter((h: any) => new Date(h.date) <= eDate);
            }

            setHistory(filtered);
        } catch (err) {
            toast.error('فشل تحميل التقرير');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCurrency) {
            fetchHistory();
        }
    }, [selectedCurrency]);

    const columns = React.useMemo<ColumnDef<any>[]>(() => [
        {
            accessorKey: 'date',
            header: 'تاريخ السعر',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 bg-card rounded-xl border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform", theme.accent)}>
                        <APP_ICONS.ACTIONS.CALENDAR size={18} />
                    </div>
                    <span className="font-mono font-black text-foreground/80">{new Date(row.original.date).toLocaleDateString('ar-AR')}</span>
                </div>
            )
        },
        {
            accessorKey: 'rate',
            header: 'سعر الصرف',
            cell: ({ row }) => (
                <span className={cn("font-mono font-black text-lg", theme.accent.replace('-700', '-900'))}>
                    {Number(row.original.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'تاريخ الإضافة للنظام',
            cell: ({ row }) => (
                <span className="text-muted-foreground/60 font-bold text-sm tracking-tight capitalize">
                    {new Date(row.original.createdAt).toLocaleString('ar-DZ')}
                </span>
            )
        },
        {
            id: 'diff',
            header: 'الفرق',
            cell: ({ row, table }) => {
                const index = row.index;
                const data = table.options.data;
                const prevItem = data[index + 1];
                const diff = prevItem ? Number(row.original.rate) - Number(prevItem.rate) : 0;

                if (diff === 0) return <span className="text-muted-foreground/40 font-bold text-[10px]">—</span>;
                return diff > 0 ? (
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black">
                        +{diff.toFixed(2)} ↑
                    </span>
                ) : (
                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black">
                        {diff.toFixed(2)} ↓
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: 'إجراءات',
            cell: ({ row }) => {
                if (!canEdit) return null;
                return (
                    <div className="flex items-center gap-2">
                        <CustomButton
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingRecord(row.original)}
                            className="w-8 h-8 text-blue-600 hover:bg-blue-50"
                        >
                            <APP_ICONS.ACTIONS.EDIT size={14} />
                        </CustomButton>
                        <CustomButton
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeletingId(row.original.id)}
                            className="w-8 h-8 text-rose-600 hover:bg-rose-50"
                        >
                            <APP_ICONS.ACTIONS.DELETE size={14} />
                        </CustomButton>
                    </div>
                );
            }
        }
    ], [theme.accent, canEdit]);

    if (fetchingCurrencies) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <APP_ICONS.STATE.LOADING className={cn("w-12 h-12 animate-spin", theme.accent)} />
                <p className="text-muted-foreground/80 font-black">جاري تحميل البيانات...</p>
            </div>
        );
    }

    const currentCurrency = currencies.find(c => c.id === selectedCurrency);

    return (
        <ProtectedRoute permission="REPORTS_CURRENCY_HISTORY_VIEW">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <PageHeader
                    icon={APP_ICONS.REPORTS.CURRENCY_HISTORY}
                    title="تقرير سجل العملات"
                    description="Currency Exchange Rate History Analysis"
                />

                {/* Filters */}
                <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-xl shadow-slate-900/5">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest mr-1">العملة</label>
                            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                                <SelectTrigger className="h-12 rounded-2xl bg-muted/50 border-border font-bold text-right" dir="rtl">
                                    <SelectValue placeholder="اختر العملة" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    {currencies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("font-black", theme.accent)}>{c.code}</span>
                                                <span>{c.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {currencies.length === 0 && <SelectItem value="none" disabled>لا توجد عملات أجنبية</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest mr-1">من تاريخ</label>
                            <div className="relative">
                                <APP_ICONS.ACTIONS.CALENDAR className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={cn("h-12 pr-11 rounded-2xl bg-muted/50 border-border font-bold focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-muted-foreground/80 uppercase tracking-widest mr-1">إلى تاريخ</label>
                            <div className="relative">
                                <APP_ICONS.ACTIONS.CALENDAR className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={16} />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={cn("h-12 pr-11 rounded-2xl bg-muted/50 border-border font-bold focus-visible:ring-2", theme.accent.replace('text-', 'focus-visible:ring-'))}
                                />
                            </div>
                        </div>

                        <CustomButton
                            onClick={fetchHistory}
                            variant="primary"
                            className="h-12"
                        >
                            <APP_ICONS.ACTIONS.SEARCH size={18} />
                            تحديث البيانات
                        </CustomButton>
                    </div>
                </div>

                {/* Data Table */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-4">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-2xl", theme.muted, theme.accent)}>
                                <APP_ICONS.ACTIONS.SORT size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground/90">تفاصيل التحركات</h2>
                                <p className="text-xs text-muted-foreground/60 font-bold uppercase tracking-tighter">Historical Exchange Rate Movements</p>
                            </div>
                        </div>
                        {currentCurrency && (
                            <div className={cn("flex items-center gap-3 bg-card px-5 py-2 rounded-2xl border shadow-sm", theme.border)}>
                                <APP_ICONS.MODULES.CURRENCIES className="text-emerald-500" size={18} />
                                <span className="text-foreground/90 font-black text-sm">{currentCurrency.name}</span>
                                <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black", theme.muted, theme.accent)}>{currentCurrency.code}</span>
                            </div>
                        )}
                    </div>

                    <DataTable
                        columns={columns}
                        data={history}
                        loading={loading}
                        searchPlaceholder="بحث في السجلات..."
                        exportFileName={`Currency_History_${currentCurrency?.code || 'Export'}`}
                        noDataMessage="لم يتم العثور على أي تغييرات في السعر ضمن الفترة المحددة"
                    />
                </div>

                {editingRecord && (
                    <EditHistoryModal 
                        history={editingRecord} 
                        onClose={() => setEditingRecord(null)} 
                        onSave={fetchHistory} 
                    />
                )}

                <ConfirmModal
                    open={!!deletingId}
                    onOpenChange={(open) => !open && setDeletingId(null)}
                    onConfirm={async () => {
                        if (!deletingId) return;
                        setIsDeleting(true);
                        try {
                            await axios.delete(`${API_BASE}/currencies/history/${deletingId}`, getAuthHeader());
                            toast.success('تم حذف السجل بنجاح');
                            fetchHistory();
                        } catch (err) {
                            toast.error('فشل الحذف');
                        } finally {
                            setIsDeleting(false);
                            setDeletingId(null);
                        }
                    }}
                    title="حذف سجل السعر"
                    description="هل أنت متأكد من حذف هذا السجل التاريخي؟ سيؤثر ذلك على تقارير الأرباح/الخسائر الناتجة عن فروق الأسعار."
                    loading={isDeleting}
                />
            </div>
        </ProtectedRoute>
    );
};

export default CurrencyHistoryReport;
