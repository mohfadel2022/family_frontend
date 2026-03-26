"use client";

import React, { useState, useEffect } from 'react';
import { APP_ICONS } from '@/lib/icons';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { usePageTheme } from '@/hooks/usePageTheme';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { CustomButton } from '@/components/ui/CustomButton';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';

import { META_BASE, getAuthHeader } from '@/lib/api';

const API_BASE = META_BASE;

export default function CurrencyAuditPage() {
    const theme = usePageTheme();
    const router = useRouter();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [threshold, setThreshold] = useState(0.05);

    const fetchAuditData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/currencies/audit?threshold=${threshold}`, getAuthHeader());
            setData(res.data);
        } catch (err: any) {
            toast.error('فشل تحميل بيانات التدقيق');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuditData();
    }, [threshold]);

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => (
                <div className="font-bold flex flex-col">
                    <span>{new Date(row.original.date).toLocaleDateString('ar-AR')}</span>
                    <span className="text-[10px] text-muted-foreground opacity-50 uppercase">{new Date(row.original.date).toLocaleTimeString('ar-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )
        },
        {
            accessorKey: 'journalEntryNumber',
            header: 'رقم القيد',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-black">{row.original.journalEntryNumber}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", 
                        row.original.type === 'RECEIPT' ? 'bg-emerald-50 text-emerald-600' :
                        row.original.type === 'PAYMENT' ? 'bg-rose-50 text-rose-600' :
                        'bg-blue-50 text-blue-600'
                    )}>
                        {row.original.type === 'RECEIPT' ? 'قبض' : row.original.type === 'PAYMENT' ? 'صرف' : 'قيد'}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'accountName',
            header: 'الحساب',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm">{row.original.accountName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{row.original.accountCode}</span>
                </div>
            )
        },
        {
            accessorKey: 'recordedRate',
            header: 'السعر المسجل',
            cell: ({ row }) => (
                <span className="font-mono font-black text-blue-600">
                    {Number(row.original.recordedRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            accessorKey: 'expectedRate',
            header: 'السعر التاريخي',
            cell: ({ row }) => (
                <span className="font-mono font-black text-slate-400">
                    {Number(row.original.expectedRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            accessorKey: 'diffPercent',
            header: 'الانحراف',
            cell: ({ row }) => {
                const diff = Number(row.original.diffPercent);
                return (
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-black",
                        diff > 5 ? "bg-rose-50 text-rose-600 border border-rose-100" :
                        diff > 1 ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        "bg-slate-50 text-slate-500"
                    )}>
                        {diff}%
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: 'الإجراءات',
            cell: ({ row }) => {
                const voucher = row.original;
                const path = voucher.type === 'RECEIPT' ? `/vouchers/receipts?id=${voucher.journalEntryId}` :
                            voucher.type === 'PAYMENT' ? `/vouchers/payments?id=${voucher.journalEntryId}` :
                            `/vouchers/journal?id=${voucher.journalEntryId}`;
                
                return (
                    <CustomButton 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => router.push(path)}
                        className="hover:scale-110 active:scale-95 transition-all text-blue-600 hover:bg-blue-50 h-8 w-8"
                    >
                        <APP_ICONS.ACTIONS.SEARCH size={16} />
                    </CustomButton>
                );
            }
        }
    ];

    return (
        <ProtectedRoute>
            <div className="flex flex-col gap-6 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
                <PageHeader 
                    title="تدقيق أسعار العملات" 
                    description="رصد الفروقات بين أسعار الصرف المسجلة في القيود وسجل العملات التاريخي المصحح."
                    icon={APP_ICONS.ACTIONS.SEARCH}
                    iconClassName="bg-blue-600 text-white"
                >
                    <div className="flex gap-3">
                         <CustomButton 
                            variant="outline" 
                            onClick={() => exportToPDF(
                                data, 
                                'تدقيق-أسعار-العملات',
                                'تقرير تدقيق أسعار العملات',
                                ['التاريخ', 'رقم القيد', 'النوع', 'الحساب', 'العملة', 'المسجل', 'المتوقع', 'الانحراف'],
                                ['date', 'journalEntryNumber', 'type', 'accountName', 'currencyCode', 'recordedRate', 'expectedRate', 'diffPercent']
                            )}
                            className="bg-white/50 border-blue-100 text-blue-700 hover:bg-blue-50"
                        >
                            <APP_ICONS.ACTIONS.EXPORT size={20} className="ml-2" />
                            PDF
                        </CustomButton>
                        <CustomButton 
                            variant="primary" 
                            onClick={fetchAuditData}
                            isLoading={loading}
                        >
                            <APP_ICONS.ACTIONS.REFRESH size={20} className={cn("ml-2", loading && "animate-spin")} />
                            تحديث البيانات
                        </CustomButton>
                    </div>
                </PageHeader>

                <div className={cn("rounded-3xl border shadow-sm p-6 space-y-6 bg-white", theme.border)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex items-center gap-4">
                            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-100">
                                <APP_ICONS.ACTIONS.SEARCH size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-blue-600/60 uppercase">إجمالي التنبيهات</p>
                                <p className="text-2xl font-black text-blue-700">{data.length}</p>
                            </div>
                        </div>
                        
                        {/* Summary of high deviations */}
                        <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50 flex items-center gap-4">
                            <div className="bg-rose-600 text-white p-3 rounded-xl shadow-lg shadow-rose-100">
                                <APP_ICONS.STATE.WARNING size={24} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-rose-600/60 uppercase">انحراف حاد {'>'} 5%</p>
                                <p className="text-2xl font-black text-rose-700">
                                    {data.filter(d => Number(d.diffPercent) > 5).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DataTable 
                        columns={columns} 
                        data={data} 
                        loading={loading}
                        searchPlaceholder="بحث في القيود أو الحسابات..."
                    />
                </div>
            </div>
        </ProtectedRoute>
    );
}
