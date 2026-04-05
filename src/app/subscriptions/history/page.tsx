"use client";

import React, { useState, useEffect } from 'react';
import {
    Wallet,
    Calendar,
    Loader2,
    CheckCircle2,
    FileText,
    Trash2,
    Users,
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
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SUB_BASE, META_BASE, getAuthHeader } from '@/lib/api';
import { APP_ICONS } from '@/lib/icons';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { WithPermission } from '@/components/auth/WithPermission';
import { CustomButton } from '@/components/ui/CustomButton';

const API_BASE = SUB_BASE;

export default function CollectHistoryPage() {
    const router = useRouter();
    const [collections, setCollections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseCurrency, setBaseCurrency] = useState<any>(null);

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{ title: string; description: string; variant: 'danger' | 'warning'; icon: any; label: string }>({
        title: '', description: '', variant: 'danger', icon: AlertCircle, label: ''
    });
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

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = async () => {
        try {
            const [collRes, curRes] = await Promise.all([
                axios.get(`${API_BASE}/collections`, getAuthHeader()),
                axios.get(`${META_BASE}/currencies`, getAuthHeader())

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
        askConfirm({
            title: "حذف سجل التحصيل",
            description: "هل أنت متأكد من حذف هذا السجل بشكل نهائي؟",
            variant: "danger",
            icon: Trash2,
            label: "حذف السجل"
        }, async () => {
            try {
                await axios.delete(`${API_BASE}/collections/${id}`, getAuthHeader());
                toast.success("تم حذف السجل بنجاح");
                fetchCollections();
            } catch (err) {
                toast.error("فشل حذف السجل");
            }
        });
    };

    const handleUnpost = async (id: string) => {
        askConfirm({
            title: "إلغاء ترحيل سند التحصيل",
            description: "هل أنت متأكد من إلغاء ترحيل هذا السند؟ سيتم حذف جميع سجلات الاشتراك المرتبطة والعودة لحالة المسودة.",
            variant: "warning",
            icon: AlertCircle,
            label: "إلغاء الترحيل"
        }, async () => {
            try {
                await axios.post(`${API_BASE}/collections/${id}/unpost`, {}, getAuthHeader());
                toast.success("تم إلغاء ترحيل السند بنجاح");
                fetchCollections();
            } catch (err: any) {
                toast.error(err.response?.data?.error || "فشل إلغاء الترحيل");
            }
        });
    };

    const columns: ColumnDef<any>[] = [
        {
            accessorKey: 'date',
            header: 'التاريخ',
            cell: ({ row }) => (
                <div className="font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-muted-foreground/60" />
                    {new Date(row.original.date).toLocaleDateString('ar-AR')}
                </div>
            )
        },
        {
            accessorKey: 'description',
            header: 'البيان',
            cell: ({ row }) => <span className="text-muted-foreground font-medium">{row.original.description}</span>
        },
        {
            accessorKey: 'items',
            header: 'العمليات',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs">
                        <Users size={14} />
                        {row.original.items?.length || 0} اشتراك
                    </div>
                    <div className="flex flex-col text-[10px] text-muted-foreground/60">
                        <span className="font-extrabold text-indigo-600">من: {row.original.debitAccount?.name || '---'}</span>
                        <span className="font-extrabold text-muted-foreground/80">إلى: {row.original.creditAccount?.name || '---'}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'totalAmount',
            header: 'الإجمالي',
            cell: ({ row }) => (
                <div className="text-right font-black text-foreground bg-muted/50 px-3 py-1 rounded-lg inline-block border border-border">
                    {Number(row.original.totalAmount).toLocaleString()} <span className="text-[10px] text-foreground/60">{row.original.currency || '...'}</span>
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
                        {row.original.status === 'DRAFT' ? <APP_ICONS.ACTIONS.EDIT size={18} /> : <APP_ICONS.ACTIONS.VIEW size={18} />}
                    </Button>
                    {row.original.status === 'POSTED' && (
                        <WithPermission permission="COLLECTS_EDIT">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUnpost(row.original.id)}
                                className="h-8 w-8 p-0 rounded-lg text-amber-600 hover:bg-amber-50"
                                title="إلغاء الترحيل"
                            >
                                <APP_ICONS.ACTIONS.UNDO size={18} />
                            </Button>
                        </WithPermission>
                    )}
                    {row.original.status === 'DRAFT' && (
                        <WithPermission permission="COLLECTS_DELETE">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(row.original.id)}
                                className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-50"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </WithPermission>
                    )}
                </div>
            )
        }
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-muted-foreground/80 font-black animate-pulse">جاري تحميل سجلات التحصيل...</p>
        </div>
    );

    return (
        <ProtectedRoute permission="COLLECTS_VIEW">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
                <PageHeader
                    icon={HistoryIcon}
                    title="سجلات التحصيل"
                    description="استعراض وإدارة جميع عمليات التحصيل المجمعة"
                >
                    <WithPermission permission="COLLECTS_CREATE">
                        <CustomButton
                            icon={APP_ICONS.MODULES.COLLECT}
                            onClick={() => router.push('/subscriptions/collect')}
                        >
                            تحصيل جديد
                        </CustomButton>
                    </WithPermission>
                </PageHeader>

                <section className="bg-card rounded-[2.5rem] border border-border shadow-sm overflow-hidden">
                    {/* <div className="p-8 border-b border-border/50 flex justify-between items-center bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-card rounded-2xl text-indigo-600 shadow-sm border border-border">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-foreground/90">قائمة السجلات</h2>
                                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">Subscription Collection Batches</p>
                            </div>
                        </div>
                    </div> */}

                    <div className="p-8">
                        <DataTable
                            columns={columns}
                            data={collections}
                            searchPlaceholder="البحث في السجلات..."
                        />
                    </div>
                </section>
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
            </div>
        </ProtectedRoute>
    );
}
