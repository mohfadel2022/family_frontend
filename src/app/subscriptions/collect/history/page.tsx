"use client";

import React, { useState, useEffect } from 'react';
import {
    Wallet,
    Calendar,
    Loader2,
    CheckCircle2,
    FileText,
    Trash2,
    Eye,
    ChevronRight,
    Users,
    ArrowRight,
    History as HistoryIcon,
    AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

const API_BASE = 'http://localhost:4000/api/subscriptions';
const META_BASE = 'http://localhost:4000/api/meta';
const AUTH_HEADER = { headers: { Authorization: 'Bearer mock-token' } };

export default function CollectHistoryPage() {
    const router = useRouter();
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            const [collRes, curRes] = await Promise.all([
                axios.get(`${API_BASE}/collections`, AUTH_HEADER),
                axios.get(`${META_BASE}/currencies`, AUTH_HEADER)
            ]);
            setCollections(collRes.data);
            const base = curRes.data.find((c: any) => c.isBase);
            setBaseCurrency(base);
        } catch (err) {
            toast.error("فشل تحميل سجلات التحصيل");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
        try {
            await axios.delete(`${API_BASE}/collections/${id}`, AUTH_HEADER);
            toast.success("تم حذف السجل بنجاح");
            fetchCollections();
        } catch (err) {
            toast.error("فشل حذف السجل");
        }
    };

    const handleUnpost = async (id: string) => {
        if (!confirm("هل أنت متأكد من إلغاء ترحيل هذا السند؟ سيتم حذف جميع سجلات الاشتراك المرتبطة والعودة لحالة المسودة.")) return;
        try {
            await axios.post(`${API_BASE}/collections/${id}/unpost`, {}, AUTH_HEADER);
            toast.success("تم إلغاء ترحيل السند بنجاح");
            fetchCollections();
        } catch (err: any) {
            toast.error(err.response?.data?.error || "فشل إلغاء الترحيل");
        }
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => (
                <div className="font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(row.original.date).toLocaleDateString('ar-EG')}
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'البيان',
            cell: ({ row }) => <span className="text-slate-600 font-medium">{row.original.description}</span>
        },
        {
            accessorKey: 'items',
            header: 'العمليات',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-indigo-600 font-black text-xs">
                    <Users size={14} />
                    {row.original.items?.length || 0} اشتراك
                </div>
            )
        },
        {
            accessorKey: 'totalAmount',
            header: 'الإجمالي',
            cell: ({ row }) => (
                <div className="text-right font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg inline-block border border-slate-100">
                    {Number(row.original.totalAmount).toLocaleString()} <span className="text-[10px] text-slate-400">{baseCurrency?.symbol || '...'}</span>
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'الحالة',
            cell: ({ row }) => (
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 uppercase tracking-wider",
                    row.original.status === 'POSTED'
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-amber-50 text-amber-700 border border-amber-100"
                )}>
                    {row.original.status === 'POSTED' ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                    {row.original.status === 'POSTED' ? 'رحل' : 'مسودة'}
                </div>
            )
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/subscriptions/collect?id=${row.original.id}`)}
                        className="h-8 w-8 p-0 rounded-lg text-indigo-600 hover:bg-indigo-50"
                    >
                        {row.original.status === 'DRAFT' ? <ChevronRight size={18} /> : <Eye size={18} />}
                    </Button>
                    {row.original.status === 'POSTED' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUnpost(row.original.id)}
                            className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:bg-amber-50"
                            title="إلغاء الترحيل"
                        >
                            <AlertCircle size={16} />
                        </Button>
                    )}
                    {row.original.status === 'DRAFT' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(row.original.id)}
                            className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50"
                        >
                            <Trash2 size={16} />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-black animate-pulse">جاري تحميل سجلات التحصيل...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <PageHeader
                icon={HistoryIcon}
                title="سجلات التحصيل"
                description="استعراض وإدارة جميع عمليات التحصيل المجمعة"
                iconClassName="bg-gradient-to-br from-indigo-500 to-indigo-700"
            >
                <Button
                    onClick={() => router.push('/subscriptions/collect')}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl h-14 px-8 shadow-xl shadow-indigo-100 flex gap-3 items-center font-black"
                >
                    <Wallet size={20} />
                    تحصيل جديد
                </Button>
            </PageHeader>

            <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm border border-slate-100">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">قائمة السجلات</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Subscription Collection Batches</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <DataTable
                        columns={columns}
                        data={collections}
                        searchPlaceholder="البحث في السجلات..."
                    />
                </div>
            </section>
        </div>
    );
}
